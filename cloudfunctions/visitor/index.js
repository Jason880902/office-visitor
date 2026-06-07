/**
 * 写字楼访客管理云函数入口
 */
const cloud = require('wx-server-sdk');
const routes = require('./config/routes');

cloud.init({
	env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
	const { route, data = {} } = event;

	// 根据路由分发到对应的控制器
	const routeConfig = routes[route];
	if (!routeConfig) {
		return { code: -1, msg: '路由不存在' };
	}

	try {
		const [controllerPath, method] = routeConfig.split('@');
		const Controller = require(`./controller/${controllerPath}`);
		const controller = new Controller(event, context);

		// 执行控制器方法
		const result = await controller[method](data);
		return { code: 0, data: result };
	} catch (err) {
		console.error('云函数执行错误:', err);
		return { code: -1, msg: err.message || '服务器错误' };
	}
};
