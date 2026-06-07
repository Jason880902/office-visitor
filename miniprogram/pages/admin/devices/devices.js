// pages/admin/devices/devices.js
Page({
	data: {
		devices: [],
		showModal: false,
		addForm: {
			deviceCode: '',
			deviceName: '',
			location: '',
			brand: 'generic',
			apiUrl: ''
		},
		brands: ['海康威视', '大华', '通用HTTP'],
		brandValues: ['hikvision', 'dahua', 'generic'],
		brandIndex: 2
	},

	onLoad() {
		this.loadDevices();
	},

	async loadDevices() {
		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: { route: 'admin/gateDevices' }
			});

			if (res.result.code === 0) {
				this.setData({ devices: res.result.data });
			}
		} catch (err) {
			console.error('加载设备列表失败:', err);
		}
	},

	onAddDevice() {
		this.setData({
			showModal: true,
			addForm: {
				deviceCode: '',
				deviceName: '',
				location: '',
				brand: 'generic',
				apiUrl: ''
			},
			brandIndex: 2
		});
	},

	hideModal() {
		this.setData({ showModal: false });
	},

	preventHide() {
		// 阻止事件冒泡
	},

	onAddInput(e) {
		const field = e.currentTarget.dataset.field;
		this.setData({
			[`addForm.${field}`]: e.detail.value
		});
	},

	onBrandChange(e) {
		const index = e.detail.value;
		this.setData({
			brandIndex: index,
			'addForm.brand': this.data.brandValues[index]
		});
	},

	async onSubmitDevice() {
		const { addForm } = this.data;

		if (!addForm.deviceCode || !addForm.deviceName) {
			wx.showToast({ title: '请填写设备编码和名称', icon: 'none' });
			return;
		}

		try {
			const res = await wx.cloud.callFunction({
				name: 'visitor',
				data: {
					route: 'admin/addDevice',
					...addForm
				}
			});

			if (res.result.code === 0) {
				wx.showToast({ title: '添加成功', icon: 'success' });
				this.hideModal();
				this.loadDevices();
			} else {
				wx.showToast({ title: res.result.msg || '添加失败', icon: 'none' });
			}
		} catch (err) {
			console.error('添加设备失败:', err);
			wx.showToast({ title: '添加失败', icon: 'none' });
		}
	},

	onTestDevice(e) {
		const id = e.currentTarget.dataset.id;
		// TODO: 测试设备连接
		wx.showToast({ title: '测试功能开发中', icon: 'none' });
	},

	onDeleteDevice(e) {
		const id = e.currentTarget.dataset.id;
		wx.showModal({
			title: '确认删除',
			content: '确定要删除此门禁设备吗？',
			success(res) {
				if (res.confirm) {
					// TODO: 删除设备
					wx.showToast({ title: '删除功能开发中', icon: 'none' });
				}
			}
		});
	}
});
