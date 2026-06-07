// pages/admin/index/index.js
Page({
	data: {
		dashboard: {}
	},

	onLoad() {
		this.loadDashboard();
	},

	onShow() {
		this.loadDashboard();
	},

	async loadDashboard() {
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

	goVisitors() {
		wx.navigateTo({ url: '/pages/admin/visitors/visitors' });
	},

	goDevices() {
		wx.navigateTo({ url: '/pages/admin/devices/devices' });
	},

	goExport() {
		this.exportData();
	},

	goSettings() {
		wx.showToast({ title: '功能开发中', icon: 'none' });
	},

	goPendingList() {
		wx.navigateTo({ url: '/pages/approve/list/list?status=0' });
	},

	goTodayList() {
		const today = new Date().toISOString().split('T')[0];
		wx.navigateTo({ url: `/pages/admin/visitors/visitors?date=${today}` });
	},

	goScan() {
		wx.navigateTo({ url: '/pages/gate/scan/scan' });
	},

	async exportData() {
		wx.showModal({
			title: '导出数据',
			content: '确定要导出所有访客数据吗？',
			success: async (res) => {
				if (res.confirm) {
					wx.showLoading({ title: '导出中...' });

					try {
						const result = await wx.cloud.callFunction({
							name: 'visitor',
							data: {
								route: 'admin/exportData'
							}
						});

						if (result.result.code === 0) {
							// 下载文件
							const fileRes = await wx.cloud.downloadFile({
								fileID: result.result.data.fileID
							});

							// 保存到本地
							const saveRes = await wx.saveFile({
								tempFilePath: fileRes.tempFilePath
							});

							wx.showToast({ title: '导出成功', icon: 'success' });
						} else {
							wx.showToast({ title: result.result.msg || '导出失败', icon: 'none' });
						}
					} catch (err) {
						console.error('导出失败:', err);
						wx.showToast({ title: '导出失败', icon: 'none' });
					} finally {
						wx.hideLoading();
					}
				}
			}
		});
	}
});
