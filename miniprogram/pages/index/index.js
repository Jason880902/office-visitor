// pages/index/index.js
const app = getApp();

Page({
	data: {
		userInfo: null,
		roleText: '访客',
		isApprover: false,
		isGatekeeper: false,
		isAdmin: false,
		dashboard: {},
		recentList: []
	},

	onLoad() {
		this.checkLogin();
	},

	onShow() {
		if (app.globalData.userInfo) {
			this.loadDashboard();
			this.loadRecentList();
		}
	},

	// 检查登录状态
	async checkLogin() {
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

				this.loadDashboard();
				this.loadRecentList();
			}
		} catch (err) {
			console.log('未登录');
		}
	},

	// 登录
	async bindLogin() {
		try {
			wx.getUserProfile({
				desc: '用于完善用户资料',
				success: async (res) => {
					const loginRes = await wx.cloud.callFunction({
						name: 'visitor',
						data: {
							route: 'user/login',
							userInfo: res.userInfo
						}
					});

					if (loginRes.result.code === 0) {
						app.globalData.userInfo = loginRes.result.data;
						this.checkLogin();
					}
				}
			});
		} catch (err) {
			wx.showToast({ title: '登录失败', icon: 'none' });
		}
	},

	// 加载仪表盘数据
	async loadDashboard() {
		if (!this.data.isAdmin && !this.data.isApprover) return;

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: { route: 'admin/dashboard' }
			});

			if (res.result.code === 0) {
				this.setData({ dashboard: res.result.data });
			}
		} catch (err) {
			console.error('加载仪表盘失败:', err);
		}
	},

	// 加载最近预约
	async loadRecentList() {
		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'visitor/myList',
					page: 1,
					size: 5
				}
			});

			if (res.result.code === 0) {
				const list = res.result.data.list.map(item => ({
					...item,
					statusText: this.getStatusText(item.status),
					statusClass: this.getStatusClass(item.status)
				}));
				this.setData({ recentList: list });
			}
		} catch (err) {
			console.error('加载预约列表失败:', err);
		}
	},

	getStatusText(status) {
		const map = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已取消', 4: '已过期', 5: '已来访' };
		return map[status] || '未知';
	},

	getStatusClass(status) {
		const map = { 0: 'pending', 1: 'approved', 2: 'rejected', 3: 'cancelled', 4: 'expired', 5: 'visited' };
		return map[status] || '';
	},

	goApply() {
		wx.navigateTo({ url: '/pages/visitor/apply/apply' });
	},

	goMyList() {
		wx.switchTab({ url: '/pages/visitor/list/list' });
	},

	goScan() {
		wx.navigateTo({ url: '/pages/gate/scan/scan' });
	},

	goApprove() {
		wx.navigateTo({ url: '/pages/approve/list/list' });
	},

	goAdmin() {
		wx.navigateTo({ url: '/pages/admin/index/index' });
	},

	goDetail(e) {
		const id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: `/pages/visitor/detail/detail?id=${id}` });
	}
});
