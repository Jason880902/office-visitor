// pages/my/index/index.js
const app = getApp();

Page({
	data: {
		userInfo: null,
		roleText: '访客',
		isApprover: false,
		isGatekeeper: false,
		isAdmin: false,
		pendingCount: 0
	},

	onLoad() {
		this.loadUserInfo();
	},

	onShow() {
		this.loadUserInfo();
	},

	async loadUserInfo() {
		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'user/getInfo'
				}
			});

			if (res.result.code === 0) {
				const userInfo = res.result.data;
				app.globalData.userInfo = userInfo;
				app.globalData.userId = userInfo._id;
				app.globalData.role = userInfo.role;

				const roleMap = { 0: '访客', 1: '审批人', 2: '核验员', 3: '管理员' };

				this.setData({
					userInfo,
					roleText: roleMap[userInfo.role] || '访客',
					isApprover: userInfo.role === 1 || userInfo.role === 3,
					isGatekeeper: userInfo.role === 2 || userInfo.role === 3,
					isAdmin: userInfo.role === 3
				});

				// 加载待审批数量
				if (this.data.isApprover || this.data.isAdmin) {
					this.loadPendingCount();
				}
			}
		} catch (err) {
			console.log('未登录');
		}
	},

	async loadPendingCount() {
		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'approve/list',
					page: 1,
					size: 1,
					status: 0
				}
			});

			if (res.result.code === 0) {
				this.setData({ pendingCount: res.result.data.total });
			}
		} catch (err) {
			console.error('加载待审批数失败:', err);
		}
	},

	goMyList() {
		wx.switchTab({ url: '/pages/visitor/list/list' });
	},

	goApprove() {
		wx.navigateTo({ url: '/pages/approve/list/list' });
	},

	goScan() {
		wx.navigateTo({ url: '/pages/gate/scan/scan' });
	},

	goAdmin() {
		wx.navigateTo({ url: '/pages/admin/index/index' });
	},

	goEdit() {
		wx.navigateTo({ url: '/pages/my/edit/edit' });
	},

	goAbout() {
		wx.navigateTo({ url: '/pages/my/about/about' });
	},

	onLogout() {
		wx.showModal({
			title: '确认退出',
			content: '确定要退出登录吗？',
			success(res) {
				if (res.confirm) {
					app.globalData.userInfo = null;
					app.globalData.userId = null;
					app.globalData.role = 0;

					wx.reLaunch({ url: '/pages/index/index' });
				}
			}
		});
	}
});
