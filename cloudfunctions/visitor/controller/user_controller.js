/**
 * 用户控制器
 */
const cloud = require('wx-server-sdk');
const { UserModel, ROLE } = require('../model/user_model');

class UserController {
	constructor(event, context) {
		this.event = event;
		this.context = context;
		this.openId = cloud.getWXContext().OPENID;
	}

	/**
	 * 用户登录
	 */
	async login() {
		const { userInfo } = this.event;

		let user = await UserModel.getByOpenId(this.openId);

		if (!user) {
			// 新用户，创建记录
			const userId = await UserModel.upsertByOpenId(this.openId, {
				nickName: userInfo.nickName,
				avatarUrl: userInfo.avatarUrl,
				gender: userInfo.gender
			});
			user = await UserModel.getById(userId);
		}

		return {
			userId: user._id,
			role: user.role,
			nickName: user.nickName,
			avatarUrl: user.avatarUrl
		};
	}

	/**
	 * 获取手机号
	 */
	async getPhone() {
		const { cloudID } = this.event;
		const res = await cloud.getOpenData({
			list: [cloudID]
		});

		if (res.list && res.list[0]) {
			const phone = res.list[0].phoneNumber;
			await UserModel.upsertByOpenId(this.openId, { phone });
			return { phone };
		}

		throw new Error('获取手机号失败');
	}

	/**
	 * 获取用户信息
	 */
	async getInfo() {
		const user = await UserModel.getByOpenId(this.openId);
		if (!user) throw new Error('用户不存在');
		return user;
	}

	/**
	 * 更新用户信息
	 */
	async update() {
		const { nickName, avatarUrl, phone, company } = this.event;
		const user = await UserModel.getByOpenId(this.openId);
		if (!user) throw new Error('用户不存在');

		await UserModel.update(user._id, {
			nickName,
			avatarUrl,
			phone,
			company
		});

		return { success: true };
	}
}

module.exports = UserController;
