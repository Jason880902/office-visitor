// pages/gate/scan/scan.js
Page({
	data: {
		result: null,
		recentRecords: [],
		showManualInput: false,
		manualId: ''
	},

	onLoad() {
		this.loadRecentRecords();
	},

	// 扫码
	onScan() {
		wx.scanCode({
			onlyFromCamera: false,
			scanType: ['qrCode'],
			success: async (res) => {
				console.log('扫码结果:', res);

				// 解析二维码内容
				const scene = res.result;
				let visitorId = '';

				// 格式: v=xxx 或 完整URL
				if (scene.includes('v=')) {
					visitorId = scene.split('v=')[1];
				} else {
					visitorId = scene;
				}

				if (!visitorId) {
					this.setData({
						result: {
							success: false,
							message: '无效的通行码'
						}
					});
					return;
				}

				await this.verifyCode(visitorId);
			},
			fail: (err) => {
				console.error('扫码失败:', err);
				wx.showToast({ title: '扫码失败', icon: 'none' });
			}
		});
	},

	// 显示手动输入
	onShowManualInput() {
		this.setData({ showManualInput: true });
	},

	// 隐藏手动输入
	onHideManualInput() {
		this.setData({ showManualInput: false, manualId: '' });
	},

	// 手动输入ID变化
	onManualIdInput(e) {
		this.setData({ manualId: e.detail.value });
	},

	// 手动核验
	async onManualVerify() {
		const id = this.data.manualId.trim();
		if (!id) {
			wx.showToast({ title: '请输入预约ID', icon: 'none' });
			return;
		}
		this.setData({ showManualInput: false, manualId: '' });
		await this.verifyCode(id);
	},

	// 验证通行码
	async verifyCode(visitorId) {
		wx.showLoading({ title: '核验中...' });

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'gate/scan',
					visitorId,
					deviceCode: 'gate-001' // 默认设备，实际使用时从设备获取
				}
			});

			if (res.result.code === 0) {
				this.setData({
					result: {
						success: true,
						...res.result.data
					}
				});

				// 播放成功提示音
				wx.vibrateShort({ type: 'heavy' });
			} else {
				this.setData({
					result: {
						success: false,
						message: res.result.msg || '核验失败'
					}
				});

				// 播放失败提示音
				wx.vibrateShort({ type: 'heavy' });
			}

			// 刷新最近记录
			this.loadRecentRecords();
		} catch (err) {
			console.error('核验失败:', err);
			this.setData({
				result: {
					success: false,
					message: '网络错误，请重试'
				}
			});
		} finally {
			wx.hideLoading();
		}
	},

	// 加载最近核验记录
	async loadRecentRecords() {
		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'gate/record',
					page: 1,
					size: 10
				}
			});

			if (res.result.code === 0) {
				this.setData({ recentRecords: res.result.data.list });
			}
		} catch (err) {
			console.error('加载记录失败:', err);
		}
	}
});
