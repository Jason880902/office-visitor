/**
 * 路由配置
 * 格式: '路由路径': '控制器文件名@方法名'
 */
module.exports = {
	// 用户相关
	'user/login': 'user_controller@login',
	'user/getPhone': 'user_controller@getPhone',
	'user/getInfo': 'user_controller@getInfo',
	'user/update': 'user_controller@update',

	// 访客预约相关
	'visitor/apply': 'visitor_controller@apply',
	'visitor/myList': 'visitor_controller@myList',
	'visitor/detail': 'visitor_controller@detail',
	'visitor/cancel': 'visitor_controller@cancel',
	'visitor/getQrcode': 'visitor_controller@getQrcode',

	// 审批相关
	'approve/list': 'approve_controller@list',
	'approve/detail': 'approve_controller@detail',
	'approve/pass': 'approve_controller@pass',
	'approve/reject': 'approve_controller@reject',

	// 门禁核验相关
	'gate/scan': 'gate_controller@scan',
	'gate/verify': 'gate_controller@verify',
	'gate/record': 'gate_controller@record',

	// 管理后台
	'admin/dashboard': 'admin_controller@dashboard',
	'admin/visitorList': 'admin_controller@visitorList',
	'admin/exportData': 'admin_controller@exportData',
	'admin/gateDevices': 'admin_controller@gateDevices',
	'admin/addDevice': 'admin_controller@addDevice'
};
