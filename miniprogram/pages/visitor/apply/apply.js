// pages/visitor/apply/apply.js
Page({
	data: {
		form: {
			visitorName: '',
			visitorPhone: '',
			visitorCompany: '',
			carNumber: '',
			visitDate: '',
			visitTime: '',
			visitReason: '',
			hostName: '',
			hostPhone: '',
			hostCompany: '',
			hostFloor: '',
			remark: ''
		},
		today: '',
		submitting: false
	},

	onLoad() {
		// 设置最小日期为今天
		const today = new Date().toISOString().split('T')[0];
		this.setData({ today });
	},

	// 输入框绑定
	onInput(e) {
		const field = e.currentTarget.dataset.field;
		this.setData({
			[`form.${field}`]: e.detail.value
		});
	},

	// 日期选择
	onDateChange(e) {
		this.setData({
			'form.visitDate': e.detail.value
		});
	},

	// 时间选择
	onTimeChange(e) {
		this.setData({
			'form.visitTime': e.detail.value
		});
	},

	// 表单验证
	validateForm() {
		const { form } = this.data;

		if (!form.visitorName) {
			wx.showToast({ title: '请输入访客姓名', icon: 'none' });
			return false;
		}

		if (!form.visitorPhone || !/^1\d{10}$/.test(form.visitorPhone)) {
			wx.showToast({ title: '请输入正确的手机号码', icon: 'none' });
			return false;
		}

		if (!form.visitDate) {
			wx.showToast({ title: '请选择来访日期', icon: 'none' });
			return false;
		}

		if (!form.visitReason) {
			wx.showToast({ title: '请填写来访事由', icon: 'none' });
			return false;
		}

		if (!form.hostName) {
			wx.showToast({ title: '请输入被访人姓名', icon: 'none' });
			return false;
		}

		if (!form.hostPhone || !/^1\d{10}$/.test(form.hostPhone)) {
			wx.showToast({ title: '请输入正确的被访人手机号', icon: 'none' });
			return false;
		}

		return true;
	},

	// 提交预约
	async onSubmit() {
		if (!this.validateForm()) return;

		this.setData({ submitting: true });

		try {
			// 请求订阅消息权限
			await wx.requestSubscribeMessage({
				tmplIds: ['your-template-id'] // 需要替换为实际模板ID
			});
		} catch (err) {
			console.log('订阅消息授权:', err);
		}

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'visitor/apply',
					...this.data.form
				}
			});

			if (res.result.code === 0) {
				wx.showModal({
					title: '提交成功',
					content: '您的访客预约已提交，等待审批通过后将生成通行码',
					showCancel: false,
					success() {
						wx.navigateBack();
					}
				});
			} else {
				wx.showToast({ title: res.result.msg || '提交失败', icon: 'none' });
			}
		} catch (err) {
			console.error('提交失败:', err);
			wx.showToast({ title: '提交失败，请重试', icon: 'none' });
		} finally {
			this.setData({ submitting: false });
		}
	}
});
