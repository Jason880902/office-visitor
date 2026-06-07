// app.js
App({
	onLaunch() {
		if (!wx.cloud) {
			console.error('请使用 2.2.3 或以上的基础库以使用云能力');
			return;
		}

		wx.cloud.init({
			env: 'cloud1-d7gnu02do0f5651c1',
			traceUser: true
		});

		this.globalData = {};
	},

	globalData: {
		userInfo: null,
		userId: null,
		role: 0
	}
});
