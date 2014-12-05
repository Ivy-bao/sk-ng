/* Controllers */

var skControllers = angular.module('skControllers', ['skServices']);

skControllers.controller('skDealistCtrl', ['$scope', '$http', '$rootScope',
    function($scope, $http, $rootScope) {
        /** share popup **/

        $scope.share_visable = false;
        $scope.share = function() {
            $scope.share_visable = !$scope.share_visable;
        }
        if ($rootScope.dealgroups == undefined) {
            $http.jsonp('http://tgapp.51ping.com/qiang/ajax/nt/list?city_id=' + $rootScope.cityid + '&callback=JSON_CALLBACK').success(function(data) {
                $rootScope.dealgroups = data.result.current[0].dealgroups;
                $rootScope.nextdealgroups = data.result.next.dealgroups;
                $rootScope.nexttime = data.result.next.time;
                $scope.now_deals = $rootScope.dealgroups;
                $scope.next_deals = $rootScope.nextdealgroups;
            });
        } else {
            $scope.now_deals = $rootScope.dealgroups;
            $scope.next_deals = $rootScope.nextdealgroups;
        }
    }
]);

skControllers.controller('skDealCtrl', ['$scope', '$routeParams', '$rootScope', '$http', '$location', 'popupService',
    function($scope, $routeParams, $rootScope, $http, $location, popupService) {
        //	$scope.status=$rootScope.status;
        $scope.dealId = $routeParams.dealId;
        $scope.checkcode_flag = 0;
        $scope.checkcode_num = "";
        $scope.deal = {};
        $scope.toast = {};

        if ($rootScope.dealInfo[$scope.dealId] == undefined) {
            $http.jsonp('http://tgapp.51ping.com/qiang/ajax/nt/detail?city_id=' + $rootScope.cityid + '&dealgroup_id=' + $scope.dealId + '&callback=JSON_CALLBACK').success(function(data) {
                $scope.deal.title = data.result.data.title;
                $scope.deal.description = data.result.data.description;
                $scope.deal.current_price = data.result.data.current_price;
                $scope.deal.list_price = data.result.data.list_price;
                $scope.deal.detail = data.result.data.detail;
                $scope.deal.tips = data.result.data.tips;
                $scope.deal.thumb_photo_url = data.result.data.thumb_photo_url;
                $scope.deal.banner_photo_url = data.result.data.banner_photo_url;
                $scope.deal.siblings = data.result.siblings;
                $scope.deal.shop_count = data.result.shop_count;
                $scope.deal.shops_url = data.result.shops_url;
                $rootScope.dealInfo[$scope.dealId] = $scope.deal;
                if (data.result.data.status != 0) {
                    $scope.buy_words = "抢";
                    $scope.buy_class = "deal-buy-z";
                } else {
                    $scope.storage_flag = 1;
                    $scope.buy_words = "抢光了";
                    $scope.buy_class = "deal-buy-o";
                    $rootScope.dealStatus[$scope.dealId] = 1;
                }
            });
        } else {
            $scope.deal = $rootScope.dealInfo[$scope.dealId];
            $http.jsonp('http://tgapp.51ping.com/qiang/ajax/nt/detail?city_id=' + $rootScope.cityid + '&dealgroup_id=' + $scope.dealId + '&callback=JSON_CALLBACK').success(function(data) {
                if (data.result.data.status != 0) {
                    $scope.buy_words = "抢";
                    $scope.buy_class = "deal-buy-z";
                } else {
                    $scope.storage_flag = 1;
                    $scope.buy_words = "抢光了";
                    $scope.buy_class = "deal-buy-o";
                    $rootScope.dealStatus[$scope.dealId] = 1;
                }
            });
        }


        $scope.$watch('checkcode_num', function() {
            if ($scope.checkcode_num.toString().length == 4) {
                codecheck();
            }
        });

        var codecheck = function() {
            $http.jsonp('http://tgapp.51ping.com/qiang/ajax/nt/verify-captcha?dealgroup_id=' + $scope.dealId + '&captcha=' + $scope.checkcode_num + '&dpid=' + $rootScope.dpid + '&version=' + $rootScope.version + '&city_id=' + $rootScope.cityid + '&callback=JSON_CALLBACK').success(function(data) {
                if (data.code == 205 && data.result.advance_order_id) {
                    $scope.checkcode_close();
                    $scope.status = 2;
                    poll(data.result.advance_order_id);

                }
                if (data.code == 201) {
                    $scope.toast = popupService.openToast('提示', '请输入正确的验证码');
                    setTimeout(function() {
                        $scope.toast = popupService.closeToast();
                        $scope.$apply();
                        $scope.checkcode_open();
                    }, 3000);
                    return;

                } else {
                    $scope.toast.title = '提示';
                    $scope.toast.words = data.result.message;
                    $scope.overlay_flag = 1;
                    $scope.toast.words_flag = 1;
                    setTimeout(function() {
                        $scope.toast.words_flag = 0;
                        $scope.overlay_flag = 0;
                        $scope.$apply();
                        $scope.checkcode_open();
                    }, 3000);
                    return;

                }
            })
        };

        var poll = function(advance_order_id) {
            var poll_count = 0;
            var poll_timer = setInterval(function() {
                $http.jsonp('http://tgapp.51ping.com/qiang/ajax/nt/poll?advance_order_id=' + advance_order_id + '&dealgroup_id=' + $scope.dealId + '&city_id=' + $rootScope.cityid + '&callback=JSON_CALLBACK').success(function(data) {
                    if (data.code == 200 && data.result.url) {
                        clearInterval(poll_timer);
                        location.href = data.result.url;
                        return;
                    }
                    if (data.code == 201) {
                        $scope.status = 1;
                        $scope.storage_flag = 1;
                        $scope.buy_words = "抢光了";
                        $scope.buy_class = "deal-buy-o";
                        $rootScope.dealStatus[$scope.dealId] = 1;
                        clearInterval(poll_timer);

                        return;
                    }
                    if (data.code == 205) {
                        if (poll_count > 5) {
                            clearInterval(poll_timer);
                        }
                        poll_count++;
                        return;
                    }
                    if (data.code == 400) {
                        alert('400:参数错误');
                        return;
                    }
                })
            }, 2000);
        };

        $scope.storage_flag = 0;
        $scope.openRemind = function() {
            $scope.remind = popupService.openRemind();
        };
        $scope.closeRemind = function() {
            $scope.remind = popupService.closeRemind();
        }
        $scope.checkcode_open = function() {
            $scope.checkcode_num = "";
            $scope.checkcode_flag = 1;
            $http.jsonp('http://tgapp.51ping.com/qiang/ajax/nt/gen-captcha?dealgroup_id=' + $scope.dealId + '&city_id=' + $rootScope.cityid + '&callback=JSON_CALLBACK').success(function(data) {
                    if (data.code == 203) {
                        location.href = data.result.login_url;
                        return;
                    }
                    if (data.code == 200) {
                        $scope.checkcode_show = data.result.code;
                    }
                })
                //$scope.overlay_flag = !$scope.overlay_flag;
        }
        $scope.checkcode_close = function() {
            $scope.checkcode_flag = 0;
        }

        /**
         * @return {void} description
         */
        $scope.remindajax = function() {
            if (!/1[3-8]+\d{9}/.test($scope.phone_num)) {
                $scope.toast.title = '提示';
                $scope.toast.words = '请输入正确得手机号';
                $scope.toast.words_flag = 1;
                setTimeout(function() {
                    $scope.toast.words_flag = 0;
                    $scope.$apply();
                }, 3000);
                return;
            };

            $http.jsonp('http://tgapp.51ping.com/qiang/ajax/nt/join?city_id=' + $rootScope.cityid + '&dealgroup_id=' + $scope.dealId + '&mobile=' + $scope.phone_num + '&callback=JSON_CALLBACK').success(function(data) {

                if (data.code == 200) {
                    $scope.toast.title = '设置成功';
                    $scope.toast.words = '开抢前您将收到购买提醒';
                }
                if (data.code == 201) {
                    $scope.toast.title = '设置成功';
                    $scope.toast.words = '您已经设置过提醒';
                }
                if (data.code == 202) {
                    $scope.toast.title = '设置失败';
                    $scope.toast.words = '请供手机号码';
                }
                if (data.code == 203) {
                    location.href = data.result.login_url;
                }
                if (data.code == 400) {
                    $scope.toast.title = '设置失败';
                    $scope.toast.words = '参数错误';
                }
                $scope.overlay_flag = 1;
                $scope.toast.words_flag = 1;
                $scope.remind_flag = 0;
                setTimeout(function() {
                    $scope.toast.words_flag = 0;
                    $scope.overlay_flag = 0;
                    $scope.$apply();
                }, 3000);

            });
        }
    }
]);
