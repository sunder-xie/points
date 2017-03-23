/**
 * 积分管理
 */
define([
    'http',
    'config',
    'pointConfig',
    'util',
    'extension'
], function (http, config, pointConfig, util, $$) {
    return {
        name: 'pointGoods',
        init: function () {
            // 分页配置
            var pageOptions = {
                page: 1,
                rows: 10
            }
			var confirm = $('#confirmModal');
            // 初始化数据表格
            var tableConfig = {
				ajax: function(origin) {
					http.post(pointConfig.api.pointGoods.list, {
						data: pageOptions,
						contentType: 'form'
					}, function(rlt) {
						origin.success(rlt)
					})
				},
				pageNumber: pageOptions.page,
				pageSize: pageOptions.rows,
				pagination: true,
				sidePagination: 'server',
				pageList: [10, 20, 30, 50, 100],
				queryParams: getQueryParams,
				onLoadSuccess: function() {},
				columns: [
				{
					width: 30,
					align: 'center',
					formatter: function(val, row, index) {
						return index + 1
					}
				},
				{ 
					width: 50,
					// 商品名
					field: 'name'
					
				},
				{
					width: 50,
					// 商品类型
					field: 'type',
					formatter: function(val, row, index) {
						switch(val) {
							case 'real':
								return '实物'
							case 'virtual':
								return '虚拟'
							default:
								return '-'
						}
					}
				},
				{
					width: 50,
					// 所需积分
					field: 'needPoints'
				},
				{
					width: 50,
					// 商品数量
					field: 'totalCount'
				},
				{
					width: 50,
					// 已兑换数量
					field: 'exchangedCount'
				},
				{
					width: 50,
					// 状态
					field: 'state',
					formatter: function(val, row, index) {
						var val = parseInt(val);
						switch(val) {
							case 0:
								return '未上架'
							case 1:
								return '已上架'
							default:
								return '-'
						}
					}
				},
				{
					width: 50,
					// 上架时间
					field: 'updateTime',
					formatter: function(value, row) {
						if(row.state == 1) {
							return value;
						}else{
							return '-';
						}
					}
				},
				{
					width:100,
					filed: 'update',
					title: '操作',
					formatter: function(value, row) {
						var res = '-';
						if(row.state == 0) {
							res = '<a href="javascript:void(0)" class="style-update"  data-toggle="modal">修改</a>&nbsp;&nbsp;<a href="javascript:void(0)" class="style-putOn"  data-toggle="modal">上架</a>';
						} 
						if(row.state == 1){
							res = '<a href="javascript:void(0)" class="style-pullOff"  data-toggle="modal">下架</a>';
						}
						return res;
					},
					events: {
						'click .style-update': updateGoodsClick,
						'click .style-putOn': putOnGoodsClick,
						'click .style-pullOff': pullOffGoodsClick
					}
				}
				]
			}

            // 初始化数据表格
            $('#goods_Table').bootstrapTable(tableConfig);
            // 搜索表单初始化
            $$.searchInit($('#searchForm'), $('#goods_Table'));

            //按钮事件
            function updateGoodsClick(e, val, row){
				//进入修改页面
				console.log('oid===>'+row.oid);
          		var oid = row.oid;
				confirm.find('.popover-title').html('提示');
				confirm.find('p').html('确定修改？');
				$("#tips_cancle").show();		
				$$.confirm({
					container: confirm,
					trigger: this,
					accept: function() {
						var form = document.updateGoodsForm;
						util.form.reset($(form))
						$$.formAutoFix($(form), row);
						console.log('form===>'+form);
						$('#updateGoodsModal').modal('show');
					}
				})
			}
            function putOnGoodsClick(e, val, row) {
				//上架
				var goodsOid = row.oid;
				confirm.find('.popover-title').html('提示');
				confirm.find('p').html('确定要上架吗？');
				$('#tip_cancel').show();
				$$.confirm({
					container: confirm,
					trigger: this,
					accept: function(){
						http.get(pointConfig.api.pointGoods.edit, {
							data: {
								oid: goodsOid,
								state: 1
							},	
						}, function(res){
								console.log('errorCode=== '+ res.errorCode);
								if(res.errorCode == 0){
									confirm.modal('hide');
									$('#goods_Table').bootstrapTable('refresh', pageOptions);
								}else{
									errorHandle(res);//??
								}
						})
					}
				});
			}
            function pullOffGoodsClick(e, val, row) {
				//下架
				var goodsOid = row.oid;
				confirm.find('.popover-title').html('提示');
				confirm.find('p').html('确定要下架吗？');
				$('#tip_cancel').show();
				$$.confirm({
					container: confirm,
					trigger: this,
					accept: function(){
						http.get(pointConfig.api.pointGoods.edit, {
							data: {
								oid: goodsOid,
								state: 2
							},
						}, function(res){
								if(res.errorCode == 0){
									confirm.modal('hide');
									$('#goods_Table').bootstrapTable('refresh', pageOptions);
								}else{
									errorHandle(res);//??
								}
						})
					}
				});
			}
            
            //搜索
           function getQueryParams(val) {
				var form = document.searchForm
				$.extend(pageOptions, util.form.serializeJson(form)); //合并对象，修改第一个对象
				pageOptions.rows = val.limit
				pageOptions.page = parseInt(val.offset / val.limit) + 1
				return val
			}

            //清空
            $('#clear').on('click', function (e) {
                e.preventDefault()
                var sform = document.searchForm
                util.form.reset($(sform))
                $('#goods_Table').bootstrapTable('refresh', pageOptions);
            });
			
			// 点击新增事件
			$('#goods_add').on('click', function() {
				$('#addGoodsModal').modal('show');
			});
			
			//新增保存按钮事件
			$('#doAddGoods').on('click', function() {
				var name = $("#add_name").val().trim();
				var needPoints = $("#add_needPoints").val().trim();
				var totalCount = $("#add_totalCount").val().trim();
				var remark = $("#add_remark").val().trim();
				//var fileOid = $("#file_oid").val().trim(); //图片
				if (name == "") {
                    $("#add_name_err").text("商品名不能为空");
                    return;
                }
				if (needPoints == "") {
                    $("#add_needPoints_err").text("所需积分不能为空");
                    return;
                }				
				if (totalCount == "") {
                    $("#add_totalCount_err").text("商品数量不能为空");
                    return;
                }				
				if (remark == "") {
                    $("#add_remark_err").text("商品介绍不能为空");
                    return;
                }
				
				var form = document.addGoodsForm;
				$(form).ajaxSubmit({
					type: 'post',
					url: pointConfig.api.pointGoods.save,
					success: function() {
						util.form.reset($(form))
						$('#addGoodsModal').modal('hide');
						$('#goods_Table').bootstrapTable('refresh', pageOptions);
					}
				})

			});
			
			//修改记录事件
			$('#doUpdateGoods').on('click', function() {
				var name = $("#update_name").val().trim();
				var needPoints = $("#update_needPoints").val().trim();
				var totalCount = $("#update_totalCount").val().trim();
				var remark = $("#update_remark").val().trim();
				//var fileOid = $("#file_oid").val().trim(); //图片
				
				if (name == "") {
                    $("#update_name_err").text("商品名不能为空");
                    return;
                }
				if (needPoints == "") {
                    $("#update_needPoints_err").text("所需积分不能为空");
                    return;
                }				
				if (totalCount == "") {
                    $("#update_totalCount_err").text("商品数量不能为空");
                    return;
                }				
				if (remark == "") {
                    $("#update_remark_err").text("商品介绍不能为空");
                    return;
                }
				
				var form = document.updateGoodsForm;
				$(form).ajaxSubmit({
					type: 'post',
					url: pointConfig.api.pointGoods.update,
					success: function() {
						util.form.reset($(form))
						$('#updateGoodsModal').modal('hide');
						$('#goods_Table').bootstrapTable('refresh', pageOptions);
					}
				})

			});
			
			// 上传弹窗按钮点击事件
			$$.uploader({
				container: $('#editOrderFileUploader'),
				btnName: '更新附件',
				size: 'sm',
				success: function(file) {
					file.furl = file.url
					
					if($("#editOrderFilesDiv").children().length > 0) {
						var a = $('<a class="files_link" style="font-size:15px;" href=" ">&nbsp;&nbsp;&nbsp;&nbsp;'+file.name+'</ a>')
					} else {
						var a = $('<a class="files_link" style="font-size:15px;" href="javascript:void(0)">'+file.name+'</ a>')
					}
					
					$("#editOrderFilesDiv").append(a)
					$('#clearEditOrderFile').show()
					editOrderFiles.push(file)
				}
			});
			
        }
    }
})
