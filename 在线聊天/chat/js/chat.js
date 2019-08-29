function Chat(data){
	this._init(data);
}

Chat.prototype = {
	config:{
		user:{},
// 		url:"http://127.0.0.1:8008/WAChat_war_exploded",
// 		wsurl:'ws://127.0.0.1:8008/WAChat_war_exploded',
		url:"http://zouhongwei.com:8800/WAChat",
		wsurl:'ws://zouhongwei.com:8800/WAChat',
	    sourcepath:'', 
		islogin:false,
		code:100,
		isfill:true,	//聊天面板是否加载
		logoevent:true,
		ws:null,
	},
	_init:function(data){
		// console.log(data);
		this.config.sourcepath=data.sourcepath;	
		this.inituser(data.url);
		this.initevent1();
	
	},
	//获取用户信息和网站信息
	inituser:function(url){
		var _this = this;
		//获取网站的用户信息
		$.ajax({
			url:url,
			type:"get",
			success:function(res){
				_this.config.user = res;
				// console.log(res)
				res = (typeof res)=='string'?JSON.parse(res):res;
				var istrue = true;
				//需要校验网站提供的用户信息的有效性 uuid必须是36位 
				istrue=(res.websign ==''||res.username ==''||res.uUID ==''||res.uUID.length!=36||res.usercode =='')?false:true;
				// istrue=()?true:false;
				if(istrue){	
					//如果验证正确请去注册用户
					_this.getuser(res);
				}else{
					//则未登陆聊天系统  参数错误
					_this.config.code = 203;
				}
			}
		})
	},
	//初始化logo事件
	initevent1:function(){
		var _this = this;
		//logo点击事件  登陆成功可弹出程序面板
		$('#chatlogo').mouseup(function(e){
			if(_this.config.islogin){
				if(chat.config.logoevent){
					$(this).fadeOut();
					//插入结构
					_this.fillcontainer();
					_this.config.isfill = false;
					//显示程序面板
					$('#chatbox').slideDown();
					$('#chat_container').slideDown();
				}
			}else{
				_this.getuser(_this.config.user);
			}
		});
		//logo可拖拽
		//添加拖拽事件 要移动的盒子，鼠标移动显示区域 
		_this.addMove('#chatlogo','#chatlogo');
		
		//外接添加好友事件
		$('.chat_add_friend').click(function(e){
			if(!_this.config.islogin){
				alert('添加失败，您还未登录！');
				return;
			}
			var uid = $(this).attr('user_id');
			if(uid==''||uid==null){
				alert('添加失败');
				return;
			}
			_this.addFriend(uid,null,e);
			alert('已发送请求');
		});
	},
	//初始化面板上的点击事件
	initevent2:function(){
		var _this = this;
		//关闭按钮的点击事件
		$('#chat_container .chat_close span').click(function(){
			$('#chatbox').slideUp();
			$('#chatlogo').fadeIn();
		});
		//用户头像的点击事件
		$('#chat_container .chat_headimg img').click(function(e){
			e.preventDefault();
			$('#chat_container .chat_headimg .chat_user_headimg').click();
		});
		//用户文件上传监听
		$('#chat_container .chat_headimg .chat_user_headimg').change(function(){
			if($(this).val()=='') return;
			var file = $(this).get(0).files[0];
			chat.uploadheadimg(file,'user');
		});
		
		//群添加头像的按钮
		$('.chat_center .chat_addchatgroup .chat_addchatgroup_headimg_but').click(function(){
			$('.chat_center .chat_addchatgroup .chat_addchatgroup_headimg').click();//隐藏文件按钮
		});
		//群文件上传监听
		$('.chat_center .chat_addchatgroup .chat_addchatgroup_headimg').change(function(){
			if($(this).val()=='') return;
			var file = $(this).get(0).files[0];
			chat.uploadheadimg(file,'group');
		});
		//群创建按钮点击事件
		$('.chat_center .chat_addchatgroup .chat_addchatgroup_submit').click(function(){
			chat.creatchatgroup();
		});
		
		//描述的输入框事件
		$('#chat_container .chat_mes .chat_description').change(function(e){
			//修改描述
			chat.updatedescription($(this).val());
		});
		//导航栏切换事件
		$('#chat_container .chat_center ul li').click(function(){
			$(this).addClass('chat_on').siblings().removeClass('chat_on');
			//显示相对应的内容框
			$('#chat_container .chat_center_box').hide().eq($(this).index()).show();
			//刷新
			var index = $(this).index();
			if(index==0){
				_this.setrequestmes();
			}else if(index==1){
				//第二个好友内容块  插入分组块   
				_this.setfriendgroup();
			}else if(index==2){
				//第三个群内容块  
				$('#chat_container .chat_center_box').eq(2).empty();
				_this.setchatgroup();
			}
			//防止创建群聊模块显示
			$('.chat_center .chat_addchatgroup').slideUp();
		})
		//添加按钮事件
		$('#chat_container .chat_add span').click(function(){
			//显示查找面板
			var chat_searchbox = chatpanle.chat_searchbox;
			//如果已经存在就显示 不存在插入
			if($('#chat_container').find('#chat_search_box').length==0){
				$('#chat_container').append($(chat_searchbox));
				_this.addeventonsearchbox();
			}
			$('#chat_search_box').fadeIn();
		});
		 //删除区域的拖放事件
		 $('#chat_container .chat_deletebox').on('dragover',function(e){
			 $(e.currentTarget).css({color:'red'});
			 e.originalEvent.preventDefault();
		 }).on('dragleave',function(e){
			 $(e.currentTarget).css({color:'white'});
		 });
		 //放入操作
		 $('#chat_container .chat_deletebox').on('drop',function(e){
			 $('#chat_container .chat_deletebox').css({color:'white'});
			 var data =JSON.parse( e.originalEvent.dataTransfer.getData('data')) ; 
			 if(data.type=='user'){
				 //删除好友
				 if(confirm('忍心要抛弃他/她吗？')){
					 chat.deletefriend(data.userid);
				 }
			 }else if(data.type == 'group'){
				 if(confirm('一定要离开（群体）吗？')){
				 	chat.deletechatgroup(data.chatgroupid);
				 }
			 }
			
		 });
		 
	},
	//修改描述
	updatedescription:function(description){
		var url = chat.config.url+'/user/updatedescription.action';
		var data = {uuid:chat.config.user.uUID,description:description}
		$.post(url,data,function(res){
			if(res.code == 200){
				$('#chat_container .chat_mes .chat_description').attr('title',description);
			}else{
				$('#chat_container .chat_mes .chat_description').val($('#chat_container .chat_mes .chat_description').attr('title'));
			}
		});
	},
	//删除好友
	deletefriend:function(userid){
		var url = chat.config.url+'/friend/deletefriend.action';
		var data = {uuid1:userid,uuid2:chat.config.user.uUID};
		$.post(url,data,function(res){
			if(res.code == 200){
				alert('再见！好之为之。。。。');
			$('#chat_container .chat_mesg_item[data_id="'+userid+'"]').remove()
			}else{
				alert('对不起！就粘着你了。。。。');
			}
		});
	},
	//退出或者解散群
	deletechatgroup:function(groupid){
		var url = chat.config.url+'/chatgroup/deletechatgroup.action';
		var data = {chatgroupid:groupid,uuid:chat.config.user.uUID};
		 
		$.post(url,data,function(res){
			if(res.code == 200){
				alert('再见！各回各家各找各妈了。。。');
				$('#chat_container .chat_mesg_item[data_id="'+groupid+'"]').remove()
			}else{
				alert('大家不想让你走，留下吧！');
			}
		});
	},
	//给查找面板上的按钮添加事件
	addeventonsearchbox:function(){
		var _this = this;
		//添加拖拽事件 要移动的盒子，鼠标移动显示区域 
		_this.addMove('#chat_search_box','#chat_search_box .chat_head');
		//关闭按钮
		$('#chat_search_box .iconfont').click(function(){
			$('#chat_search_box').slideUp();
		});
		//查询按钮
		$('#chat_search_input_but').click(function(){
			_this.searchUG();
		});
		
	},
	//给好友和群模块的头像部分添加点击事件打开聊天
	openchatevent:function(){
		var _this = this;
		$('.chat_mesg_item').click(function(){
			//如果只是请求信息不触发
			if($(this).attr('data_id')==null||$(this).attr('data_id')=='') return; 
			var item = $(this).clone();
			//如果是未读信息中的  需要移除红色小图标 并且还需要设置消息为已读
			if(item.find('.chat_mesg_num').length!=0){
				$(this).remove();
				item.find('.chat_mesg_num').remove();
				item.find('.chat_name font').remove();
			}
			_this.oppenchat(item);
		})
	},
	//打开聊天面板 item --点击的用户或群的所有信息 state--用户和群的标志
	oppenchat:function(item){
		var _this = this;
		var $chat = $('#chatbox');
		var state = item.attr('state');//判断是群还是用户
		if($chat.find('#chat_message_panel').length==0){	//如果不存在 则添加
			$chat.append(chatpanle.chat_box);	//添加聊天大面板
			$('#chat_message_panel .chat_message_panel_head .iconfont').click(function(){
				//点击一次当前聊天 为了设置信息已读
				$('#chat_message_panel .chat_message_panel_body .chat_mesg_item.chat_active').click();
				$(this).parents('#chat_message_panel').slideUp();
			})	//给关闭按钮添加事件
			$('#chat_message_panel .chat_message_panel_body').append(chatpanle.chat_box_left);//添加左侧面板 
			//添加左侧用户或群
			//添加中间面板和聊天信息
			$('#chat_message_panel .chat_message_panel_body').append(chatpanle.chat_box_center); 
			//发送和清空按钮的事件
			this.sendandclearevent();
			//如果点击的是群聊天的话 添加右边的群成员面板 且显示该群的群成员
			$('#chat_message_panel .chat_message_panel_body').append(chatpanle.chat_box_right); 
			
			$('#chat_message_panel .chat_chatgroup_member').append('<p>群成员</p>');
			//如果是群主添加一个可踢人区域  
			$('#chat_message_panel .chat_message_panel_body .chat_chatgroup_member').append("<div class='chat_deletebox'>踢&nbsp;出&nbsp;群</div>");
			this.addMove('#chat_message_panel','.chat_message_panel_head');//可拖拽
			 //删除区域的拖放事件
			$('#chat_message_panel .chat_deletebox').on('dragover',function(e){
					 $(e.currentTarget).css({color:'red'});
						 e.originalEvent.preventDefault();
			}).on('dragleave',function(e){
					 $(e.currentTarget).css({color:'white'});
			});
			//放入操作
			$('#chat_message_panel .chat_deletebox').on('drop',function(e){
				 var userid =e.originalEvent.dataTransfer.getData('userid'); 
				 var uuid = chat.config.user.uUID;
				 if(uuid == userid) return; //群主不删除
				 if(confirm('踢了他？')){
					 var data = {
						 userid:userid,
						 chatgroupid:$('#chat_message_panel .chat_users .chat_active').attr('data_id'),
						 uuid:uuid
					 }
					 var url = _this.config.url+'/groupmember/removeMember.action';
					 $.post(url,data,function(res){
						if(res.code == 200){
							//移除当前的模块
							$('#chat_message_panel .chat_chatgroup_member .chat_mesg_item[data_id="'+userid+'"]').fadeOut();
						}else{
							alert("处理失败！！！");
						}
					 });
				 }
			});
		}	
		
		//如果点击的群或用户已经在左侧的用户面板中  直接删除 再添加
		item.unbind('click');
		$('#chat_message_panel .chat_users').find('[data_id='+item.attr('data_id')+']').remove();
		item.find('.chat_content').addClass('chat_content2');
		item.click(function(){
			$('.chat_message ul').empty();
			_this.getMessage($(this),-1,'next');
		});
		$('#chat_message_panel .chat_users').append(item);
		//清空消息
		$('.chat_message ul').empty();
		//获取相应的聊天记录
		this.getMessage(item,-1,'next');	//用户给UUID 群id
		$('#chat_message_panel').fadeIn();	//显示
		
	},
	//发送和清空等按钮事件
	sendandclearevent:function(){
		var _this = this;
		//发送按钮
		$('#chat_message_panel .chat_message_panel_body .chat_sendmesg_but').click(function(){
			_this.sendMessage();
		});
		//清空按钮
		$('#chat_message_panel .chat_message_panel_body .chat_clearmesg_but').click(function(){
			$('#chat_message_panel .chat_message_panel_body .chat_message_textarea').val('');
		});
	},	
	//获取聊天记录item当前打开的聊天用户 offsetid最近的一个聊天信息的id（开始位置）  type prev往上找 next往下找
	getMessage:function(item,offsetid,type){
		// console.log(123);
		var _this = this;
		var state = item.attr('state');
		item.addClass('chat_active').siblings().removeClass('chat_active');
		var url;
		var data;
		var id = item.attr('data_id');
		//添加一个加载历史记录的按钮
		if($('.chat_message_panel_body .chat_message ul').find('.chat_message_history').length == 0){
			$('.chat_message_panel_body .chat_message ul').prepend('<li><a href="javascript:void(0)" class="chat_message_history">更多</a></li>')
			//点击事件
			$('.chat_message ul li .chat_message_history').click(function(){
				_this.getmorehistory();
			});
		}
		//将用户信息设置到头部
		var username = item.find('.chat_name').text();
		$('#chat_message_panel .chat_message_panel_head .chat_curuser').text(username);
		if(state == 1){
			$('#chat_message_panel .chat_chatgroup_member').hide();
			$('#chat_message_panel').css({width:'680px'});
			url = this.config.url+'/message/listUserMessage.action';
			data = {uuid1:id,uuid2:this.config.user.uUID,id:offsetid,type:type};
		}else{
			$('#chat_message_panel .chat_chatgroup_member').show();
			$('#chat_message_panel').css({width:'780px'});
			//获取群成员
			this.getchatgroupmember(item.attr('data_id'));
			url = this.config.url+'/message/listGroupMessage.action';
			data = {groupid:id,id:offsetid,type:type,uuid:this.config.user.uUID}
		}
		$.post(url,data,function(res){
			// console.log(res);	
			if(res.code==200){
				var rs = res.result;
				//消息填充
				_this.setmessageitem(rs,item,type);
			} 
		});
		 
	},
	//设置信息到面板
	setmessageitem:function(rs,item,type){
		//填充数据
		var _this = this;
		var message = chatpanle.message;
		var str = '';
		var curid = _this.config.user.uUID;
		var curname = _this.config.user.username;
		var state = item.attr('state');
		var username = item.find('.chat_name').text();
		// console.log( _this.config.user)
		if(state == 1){	//用户
			for(var i=0,len=rs.length; i<len; i++){
				var a = $(message);
				var mesg = rs[i];
				a.attr('mesgid',mesg.id);
				if(mesg.sendid == curid){
					a.find('.chat_message_item').addClass('chat_bymyself');
					a.find('.chat_name').text(curname);
				}else{
					a.find('.chat_name').text(username);
				}
				a.find('span').eq(1).text(mesg.time.substr(5,11));
				a.find('.chat_message_item_message').text(mesg.content);
				if(type=='next'){
					//在之后插入
					$('.chat_message_panel_body .chat_message ul').append(a);
				}else{
					//在之前插入
					$('.chat_message_panel_body .chat_message ul li').eq(1).before(a);
				}
			}
		}else{//群
			for(var i=0,len=rs.length; i<len; i++){
				var a = $(message);
				var mesg = rs[i];
				a.attr('mesgid',mesg.id);
				if(mesg.userid == curid){
					a.find('.chat_message_item').addClass('chat_bymyself');
				} 
				var name = mesg.username;
				if(!mesg.username){
					//通过sendid从群成员查找到发送者姓名
					name = $('.chat_message_panel_body .chat_chatgroup_member .chat_mesg_item[data_id='+mesg.userid+']').find('.chat_name').text();
				}
				a.find('.chat_name').text(name);
				a.find('span').eq(1).text(mesg.time.substr(5,11));
				a.find('.chat_message_item_message').text(mesg.content);
				if(type=='next'){
					//在之后插入
					$('.chat_message_panel_body .chat_message ul').append(a);
				}else{
					//在之前插入
					$('.chat_message_panel_body .chat_message ul li').eq(1).before(a);
				}
			}
		}
		if(type=='next'){	//如果往下加载则让滚动条置最底下
			_this.scrollbottom();
		}
	},
	//获取更多的历史记录的按钮点击事件
	getmorehistory:function(){
		//获取最早的消息id
		var oldid = $('.chat_message ul li').eq(1).attr('mesgid');
		if(!oldid){
			oldid = -1;
		}
		//接收方
		var item = $('#chat_message_panel .chat_users').find('.chat_active');
		this.getMessage(item,oldid,'prev');
	},
	//使消息的滚动条在最下面
	scrollbottom:function(){
		var $div = $('#chat_message_panel .chat_message_box .chat_message');
		$div[0].scrollTop = $div[0].scrollHeight;
	},
	//发送消息
	sendMessage:function(){
		var _this = this;
		//消息内容
		var message = $('#chat_message_panel .chat_message_panel_body .chat_message_textarea').val();
		$('#chat_message_panel .chat_message_panel_body .chat_message_textarea').val('');
// 		//接收方
		var item = $('#chat_message_panel .chat_users').find('.chat_active');
		var receiveid = item.attr('data_id');
		var sendid  = this.config.user.uUID;
		//通过state判断是群聊还是单聊 1 单 2 群
		var data = {receiveid:receiveid,sendid:sendid,content:message,type:item.attr('state')};
		ws = _this.config.ws;
	    if(ws == null){
		    _this.openws();
	    } 
		// Web Socket 已连接上，使用 send() 方法发送数据
		//json
	    ws.send(JSON.stringify(data));
	},
	//收到消息处理
	dealMessage:function(data){
		// console.log(data);
		var mesg = $.parseJSON(data.data).result;
		var item='';
		if(mesg.receiveid){	//用户
			item = $('#chat_message_panel .chat_users .chat_mesg_item[data_id="'+mesg.receiveid+'"]');
			item = (item.length==0)?$('#chat_message_panel .chat_users .chat_mesg_item[data_id="'+mesg.sendid+'"]'):item;
		}else{//群
			item = $('#chat_message_panel .chat_users .chat_mesg_item[data_id="'+mesg.groupid+'"]');
		}
		var audio= new Audio(chat.config.sourcepath+"chat/img/dingdong.mp3");//这里的路径写上mp3文件在项目中的绝对路径
		if(item.length==0){	//不存在聊天面板中 设置到提醒面板中 点击刷新
			audio.play();//播放
			$('.chat_center .chat_nav li:eq(0)').click();
			$('#chat_logo').hover();
		}else{//存在更新信息 
			//并且当前是该聊天页面
			if(item.hasClass('chat_active')){
				var rs = new Array();
				rs.push(mesg)
				console.log(rs);
				this.setmessageitem(rs,item,'next');
				// console.log(rs);
			}else{
				audio.play();//播放
			}
		}

	},
	//打开websocket
	openws:function(){
		if ("WebSocket" in window) {
		     // 打开一个 web socket
		    var url = this.config.wsurl+'/websocket';
			 this.config.ws = new WebSocket(url);
	    }else if('MozWebSocket' in window){
			 this.config.ws = new MozWebSocket(url);
		}else{
			alert('对不起您的浏览器不支持WebSocket聊天！！');
			return ;
		}
		this.config.ws.onopen = function() {
			  // console.log("发送数据");
		};
		this.config.ws.onmessage = function (evt) { 
			//收到消息处理
			chat.dealMessage(evt);
		};
		this.config.ws.onclose = function(){ 
			  // 关闭 websocket
			  alert('您已掉线！！');
			  //删除聊天面板
			  $('#chat_message_panel').remove();
			  //隐藏程序面板
			  $('#chatbox').slideUp();
			  $('#chat_container').slideUp();
			  //显示logo
			  $('#chatlogo').fadeIn();
			  //设置未登录
			  chat.config.islogin = false;
		};
			
	},
	//获取并设置群成员
	getchatgroupmember:function(groupid){
		//将成员内容清空
		$('#chat_message_panel .chat_chatgroup_member .chat_mesg_item').remove();
		//获取群成员
		var url = this.config.url+'/groupmember/listmember.action';
		var data = {groupid:groupid};
		$.get(url,data,function(res){
			// console.log(res);
			//设置群成员
			if(res.code == 200){
				//将好友设置进去 应该循环赋值添加  
				var chat_center_box_item = chatpanle.chat_center_box_item;
				for(var i=0,len=res.result.length; i<len;i++){
					var item = res.result[i];
					var a = $(chat_center_box_item);
					//头像 如果有值就插入 没有就默认
					a.find('img').attr('src',chat.config.sourcepath+'chat/img/default.png');
					if(item.headimgpath){
						a.find('img').attr('src',item.headimgpath)
					}
					a.attr('data_id',item.uUID);	
					a.find('.chat_name').text(item.username);	//姓名
					a.find('.chat_mesg').attr('title',item.description).text(item.description);	//描述
					if(item.state == 0){	//不在线设置灰度
						a.addClass('chat_out')
					}
					a.find('.chat_content').addClass('chat_content2');
					
					if(item.status == 2){//群主
						a.find('.chat_name').css({color:'red'}); 
						$('#chat_message_panel .chat_chatgroup_member>p').after(a);
					}else{
						$('#chat_message_panel .chat_chatgroup_member').append(a);
					}
				}
				//判断是否为群主
				var ownerid = $('#chat_message_panel .chat_users .chat_active').attr('owner_id');
				var uuid = chat.config.user.uUID;
				if(ownerid == uuid){
					//可拖拽踢出群
					$('#chat_message_panel .chat_chatgroup_member .chat_mesg_item').attr('draggable','true');
					$('#chat_message_panel .chat_chatgroup_member .chat_mesg_item').on('dragstart',function(e){
						//获取参数
						var userid = $(this).attr('data_id');
						e.originalEvent.dataTransfer.setData('userid',userid);
						 $('#chat_message_panel .chat_chatgroup_member .chat_deletebox').fadeIn();
					})
					$('#chat_message_panel .chat_chatgroup_member .chat_mesg_item').on('dragend',function(){
						 $('#chat_message_panel .chat_chatgroup_member .chat_deletebox').fadeOut();
					})
				}
			}
			});
		
	},
	//加群
	addChatGroup:function(groupid,butdiv){
		var _this = this;
		$.ajax({
			url:_this.config.url+'/groupmember/addchatgroup.action',
			type:"post",
			data:{userid:_this.config.user.uUID,groupid:groupid},
			success:function(res){
				// console.log(res);
				if(res.code == 200){
					result = res.result;
					butdiv.text('已发送请求');
				}else{
					butdiv.text('已加入');
				}
			}
		})
	},
	//设置好友分组 并显示弹出层  点击确定回调函数
	setfriendGroup:function(touser_id,butdiv,e,callback){
		//获取好友分组
		var groups = this.getfriendgroup();
		//获取弹出层
		$box = $(chatpanle.choosefriendgroup);
		option = '';
		for(var i=0,len=groups.length;i<len;i++){
			var a = groups[i];
			option += '<option value ="'+a.id+'">'+a.name+'</option>';
		}
		$box.find('.chat_choosefriendgroup_select').append(option);
		//设置位置
		var top = (e.clientY-30)<15?15:e.clientY-30;
		var left = (e.clientX-150)<15?15:e.clientX-150;
		$box.css({top:top+'px',left:left+'px'});
		$('#chatbox').append($box);
		$box.show();
		
		//确认和取消事件
		$('#chatbox .chat_choosefriendgroup .chat_choosefriendgroup_sure').click(function(){
			callback(touser_id,butdiv);
			$('#chatbox .chat_choosefriendgroup').remove();
		});
		$('#chatbox .chat_choosefriendgroup .chat_choosefriendgroup_close').click(function(){
			$('#chatbox .chat_choosefriendgroup').remove();
		});
		
	},
	//加好友 2
	addFriend2:function(touser_id,butdiv){
		var ask_userid = chat.config.user.uUID;
		//获取值返回
		groupid = $('#chatbox .chat_choosefriendgroup .chat_choosefriendgroup_select').val();
	 
		$.ajax({
			url:chat.config.url+'/friend/addfriend.action',
			type:"post",
			data:{ask_userid:ask_userid,to_userid:touser_id,groupid:groupid},
			success:function(res){
				// console.log(res);
				if(res.code == 200){
					result = res.result;
					butdiv.text('已发送请求');
				}else{
					butdiv.text('已是好友');
				}
			}
		})	 
	},
	//加好友 1
	addFriend:function(touser_id,butdiv,e){
		var _this = this;
		var ask_userid = _this.config.user.uUID;
		if(ask_userid == touser_id){
			if(butdiv)
			butdiv.text('加自己干嘛');
			return;
		}
		//设置分组
		var groupid = _this.setfriendGroup(touser_id,butdiv,e,_this.addFriend2);
	},
	//获取当前用户信息
	getuser:function(date){
		var _this = this;
		var url = _this.config.url;
		$.ajax({
			url:url+"/user/insert.action",
			data:date,
			type:"post",
			xhrFields: {
				withCredentials: true
			},
			crossDomain: true,
			success:function(res){
				// console.log(res);
				if(res.code == 200){
					//登陆成功
					_this.config.islogin = true;
					_this.config.user = res.result;
					//设置logo为绿色
					$('#chatlogo .iconfont').css({color:"green",fontWeight:"bold"});
					//打开websocket 
					ws = _this.config.ws;
					_this.openws();
				}else{
					_this.config.user = null;
					// console.log(res.mesg);
					alert("您还未登陆或者登陆失败!");
				} 
				_this.config.code = res.code;
		}
		});
	},
	//程序面板的html结构
	fillcontainer:function(){
		//每次只加载一次结构
		if(this.config.isfill){
			//添加大盒子
			var chat_all_box = chatpanle.chat_all_box;
			// console.log(chat_all_box);
			$('html body').append(chat_all_box);
			//添加html结构
			var chathead = chatpanle.chat_head;
			$('#chat_container').prepend(chathead);
			//设置可拖动
			this.addMove('#chatbox','.chat_chathead');
			//用户信息
			var user = this.config.user;
			$('#chat_container .chat_mes .chat_username').text(user.username);	//设置用户名
			// chat/img/default.png  默认头像
			// console.log(user);
			var src = (user.headimgpath == ""||!user.headimgpath)?chat.config.sourcepath+'chat/img/default.png':user.headimgpath;
			$('#chat_container .chat_headimg img').attr('src',src);		//设置头像
			$('#chat_container .chat_mes .chat_description').attr('title',user.description)
			$('#chat_container .chat_mes .chat_description').val(user.description);//设置描述
			//分组块
			var chat_center = chatpanle.chat_center;
			$('#chat_container').append(chat_center);
			//导航块
			var chat_center_nav = chatpanle.chat_center_nav;
			$('#chat_container .chat_center').append(chat_center_nav);
			//内容块 
			var chat_center_box = chatpanle.chat_center_box;
			for(var i=0;i<3;i++){
				$('#chat_container .chat_center').append(chat_center_box);
			}
			$('#chat_container .chat_center_box').first().show();
			//创建群模块
			var creatchatgroup = chatpanle.creatchatgroup;
			$('#chat_container .chat_center').append(creatchatgroup);
		
			//拖拽删除区域
			$('#chat_container .chat_center').append("<div class='chat_deletebox'>拖&nbsp;到&nbsp;这&nbsp;移&nbsp;除</div>");
			//初始化事件
			this.initevent2();
		}
		
		//第一个系统消息内容块  插入信息块   
		this.setrequestmes();
		
	},
	//文件上传
	fileupload:function(filedata,callback){
		// console.log('上传文件')
		var url = chat.config.url+'/file/uploadheadimg.action';
		$.ajax({
			url:url,
			type:'post',
			data:filedata,
			processData:false,
			contentType:false,
			success:function(rs){
				callback(rs);
			}
		});
	},
	//文件上传返回文件路径 type 判断是群还是用户头像 
	uploadheadimg:function(file,headimgtype){
		// console.log(file);
		if(!file.type.startsWith('image/')){
			alert('请上传图片文件！');
			return false;
		}
		if(file.size>1024*520){
			alert('文件不能大于512KB');
			return false;
		}
		var formdata = new FormData();
		formdata.append('file',file);
		chat.fileupload(formdata,function(rs){
			var src = rs.result;
			if(headimgtype=='group'){
				$('.chat_center .chat_addchatgroup .chat_addchatgroup_headimg_but').attr('imgpath',src);
				$('.chat_center .chat_addchatgroup .chat_addchatgroup_headimg_but').css({background:'url('+src+') no-repeat','background-size':'100% 100%'});
			}else if(headimgtype=='user'){
				//修改头像
				var data = {uuid:chat.config.user.uUID,headimgpath:src};
				var url = chat.config.url+"/user/updateheadimg.action";
				$.post(url,data,function(res){
					if(res.code==200){
						$('#chat_container .chat_headimg img').attr('src',src);
					}else{
						alert('头像更换失败');
					}
				});
			}
			
		});
	},
	//创建群聊
	creatchatgroup:function(){
		// console.log('创建群聊')
		var $groupname = $('.chat_center .chat_addchatgroup .chat_addchatgroup_groupname');
		if($groupname.val().trim()==''||$groupname.val().trim().length>=10){
			erro($groupname);
			return;
		}
		var $groupdescription = $('.chat_center .chat_addchatgroup .chat_addchatgroup_description');
		if($groupdescription.val().trim().length>=30){
			 erro($groupdescription);
			 return;
		}
		var url = chat.config.url+'/chatgroup/addchatgroup.action';
		var headimgpath = $('.chat_center .chat_addchatgroup .chat_addchatgroup_headimg_but').attr('imgpath');
		var data = {
			groupname:$groupname.val().trim(),
			description:$groupdescription.val().trim(),
			headimgpath:headimgpath,
			ownerid:chat.config.user.uUID
		}
		$.post(url,data,function(res){
			if(res.code == 200){
				$('.chat_center .chat_addchatgroup').hide();
				$('#chat_container .chat_center ul li').eq(2).click();
			}else{
				alert('创建失败！每人只能创建5个群哦！');
			}
			clear();
		});
		//清空表单
		function clear(){
			$('.chat_center .chat_addchatgroup input').val('');
			$('.chat_center .chat_addchatgroup .chat_addchatgroup_headimg_but').css({background:'none'});
		}
		//错误提示
		function erro(input){
			input.focus();
			input.css({border:'2px solid red'});
			setTimeout(function(){input.css({border:'1px solid black'});},2000)
		}
	},
	//获取已加入的群聊
	setchatgroup:function(){
		var _this = this;
		var uuid = _this.config.user.uUID;
		var data = {uuid:uuid};
		var url = _this.config.url+'/chatgroup/listchatgroup.action';
		$.get(url,data,function(res){
			if(res.code == 200){
				var chat_center_box_item = chatpanle.chat_center_box_item;
				for(var i=0,len=res.result.length; i<len;i++){
					var item = res.result[i];
					var a = $(chat_center_box_item);
					//头像 如果有值就插入 没有就默认
					a.find('img').attr('src',chat.config.sourcepath+'chat/img/groupdefault.png');
					if(item.headimgpath){
						a.find('img').attr('src',item.headimgpath)
					}
					a.attr('data_id',item.id);	
					a.attr('owner_id',item.ownerid);
					a.find('.chat_name').text(item.groupname);	//姓名
					a.attr('state',2);	//设置为群
					a.find('.chat_mesg').attr('title',item.description).text(item.description);	//描述
					//如果是群主 置顶且为红色字体
					if(uuid == item.ownerid){
						a.find('.chat_name').css({color:'red'});	//我的群
						$('.chat_center_box').eq(2).prepend(a);
					}else{
						$('.chat_center_box').eq(2).append(a);
					}
					a.attr('draggable','true');
				}
				//群内容块的可拖动
				$('#chat_container .chat_mesg_item').on('dragstart',function(e){
					//获取参数
					chatgroupid = $(this).attr('data_id');
					data = {
						type:'group',
						chatgroupid:chatgroupid
					}
					e.originalEvent.dataTransfer.setData('data',JSON.stringify(data));
					//设置删除区域显示
					$('#chat_container .chat_deletebox').show();
					
				});
				$('#chat_container .chat_mesg_item').on('dragend',function(e){
					//设置删除区域隐藏
					$('#chat_container .chat_deletebox').hide();
				});
				//给每个好友添加点击事件
				_this.openchatevent();
			}
		});
		//添加群内容模块的按钮 和点击事件
		$('.chat_center_box').eq(2).append('<div class="chat_addchatgroup_showbut"><span class="iconfont">&#xe697</span>');
		$('.chat_center_box').eq(2).find('.chat_addchatgroup_showbut').click(function(){
			$(this).find('.iconfont').toggleClass('iconfont_ative');
			$('.chat_center .chat_addchatgroup').slideToggle();
		});
	},
	//系统信息  加好友 加群   未读信息等
	setrequestmes:function(){	
		//先清空
		$('#chat_container .chat_center_box').first().empty();
		var _this = this;
		var r1 = false;  //标志  为了给按钮添加点击事件
		var r2 = false;	//只有两次请求都完成才能添加
		//获取好友请求
		var url1 = _this.config.url+'/friend/friendrequest.action?UUID='+_this.config.user.uUID;
		$.get(url1,function(res){
			if(res.code == 200){
				var chat_center_box_item = chatpanle.chat_center_box_item;
				for(var i=0;i<res.result.length;i++){
					var item = res.result[i];
					var a = $(chat_center_box_item);
					var src = (item.headimgpath)?item.headimgpath:chat.config.sourcepath+"chat/img/default.png";
					a.find('img').attr('src',src);
					a.find('.chat_name').html(item.username+"  <font size='1'>"+item.ask_time.substr(5,11)+"</font>");
					var te = "<font color='green'>"+item.username+"</font> 申请添加你为好友:!!!";
					a.find('.chat_mesg').html(te);
					a.attr('ask_userid',item.uUID);
					//添加同意和不同意按钮
					var allowbut = '<button class="chat_allowbut">同意</button>';
					var nobut = '<button class="chat_nobut">拒绝</button>';
					a.append(allowbut);
					a.append(nobut);
					$('#chat_container .chat_center_box').first().append(a);
				}
			}
			r1 = true;
			addclick();
		});
		//获取加群请求
		var url2 =  _this.config.url+'/groupmember/chatgrouprequest.action?ownerid='+_this.config.user.uUID;
		$.get(url2,function(res){
			if(res.code == 200){
				var chat_center_box_item = chatpanle.chat_center_box_item;
				for(var i=0;i<res.result.length;i++){
					var item = res.result[i];
					var a = $(chat_center_box_item);
					var src = (item.headimgpath)?item.headimgpath:chat.config.sourcepath+"chat/img/groupdefault.png";
					a.find('img').attr('src',src);
					a.find('.chat_name').html(item.groupname+"  <font size='1'>"+item.ask_time.substr(5,11)+"</font>");
					var te = "<font color='green'>"+item.username+"</font>  请求加入群！！！"
					a.find('.chat_mesg').html(te);
					a.attr('userid',item.uUID);
					a.attr('chatgroupid',item.id);
					//添加同意和不同意按钮
					var allowbut = '<button class="chat_allowbut">同意</button>';
					var nobut = '<button class="chat_nobut">拒绝</button>';
					a.append(allowbut);
					a.append(nobut);
					$('#chat_container .chat_center_box').first().append(a);
				}
			}
			r2 = true;
			addclick();
		});
		//获取未读信息
		var url3 = _this.config.url+'/search/noReadMes.action?uuid='+_this.config.user.uUID;
		$.get(url3,function(res){
			// console.log(res);
			if(res.code == 200){
				var chat_center_box_item = chatpanle.chat_center_box_item; //模板
				for(var i=0,len=res.result.length;i<len;i++){
					var item = res.result[i];
					var a = $(chat_center_box_item);
					var src = (item.headimg)?item.headimg:chat.config.sourcepath+"chat/img/default.png";  //默认为用户
					if(item.type == 2){	//群
						src = (item.headimgpath)?item.headimgpath:chat.config.sourcepath+"chat/img/groupdefault.png";
					}
					a.find('img').attr('src',src);
					a.find('.chat_name').html(item.name+"  <font size='1'>"+item.time.substr(5,11)+"</font>");
					a.attr('data_id',item.uid);	
					a.attr('state',item.type);
					a.find('.chat_mesg').attr('title',item.content).text(item.content);	//聊天信息
					a.append('<div class="chat_mesg_num">'+item.num+'</div>');	//显示信息数
					$('#chat_container .chat_center_box').first().append(a);
				}
				_this.openchatevent();
			}
			
		});
		
		
		function addclick(){
			if(r1&&r2){
				//给按钮添加事件 
				$('#chat_container .chat_mesg_item .chat_allowbut').click(function(e){
					_this.dorequest($(this),true,e);
				});
				$('#chat_container  .chat_mesg_item .chat_nobut').click(function(e){
					_this.dorequest($(this),false,e);
				});
			}
		}
	
	},
	//同意就加好友并分组
	agreefriend:function(data,nullparam){
		// console.log(data);
		data.groupid = $('#chatbox .chat_choosefriendgroup .chat_choosefriendgroup_select').val();
	    var url = chat.config.url+'/friend/dofriendrequest.action';
		$.post(url,data,function(res){
			if(res.code == 200){
				//移除当前的模块
				
				 $('.chat_center_box .chat_mesg_item[ask_userid="'+data.ask_userid+'"]').slideUp();
			}else{
				alert("处理失败！！！");
			}
		});
	},
	//同意按钮事件 拒绝按钮事件  isagree 是否同意
	dorequest:function(that,isagree,e){
		//判断是好友还是群
		var _this = this;
		var state = isagree?2:1;
		// console.log(that.parent().attr('ask_userid'));
		if(that.parent().attr('ask_userid')){
			var ask_userid = that.parent().attr('ask_userid');
			//发送处理请求
			//这里要获取分组id  
			var data = {
				ask_userid:ask_userid,
				to_userid:_this.config.user.uUID,
				state:state,
				groupid:-1
			}
			if(isagree){
				chat.setfriendGroup(data,null,e,chat.agreefriend);
			}else{
				 sendrequest('/friend/dofriendrequest.action',data);
			}
		}else{

			var data = {
				userid:that.parent().attr('userid'),
				chatgroupid:that.parent().attr('chatgroupid'),
				state:state
			}
			sendrequest('/groupmember/doCGroupRequest.action',data);
			//发送处理请求
		}
		
		 function sendrequest(url,data){
			 var url = _this.config.url+url;
			 $.post(url,data,function(res){
				if(res.code == 200){
					//移除当前的模块
					that.parent().slideUp();
				}else{
					alert("处理失败！！！");
				}
			 });
		 }
	},
	//获取用户的分组
	getfriendgroup:function(){
		var _this = this;
		var data = {UUID:_this.config.user.uUID};
		var result = {};
		$.ajax({
			url:_this.config.url+'/friendgroup/listall.action',
			async:false,
			type:"get",
			data:data,
			xhrFields: {
				withCredentials: true
			},
			crossDomain: true,
			success:function(res){
			//将分组信息赋值
			if(res.code == 200){
				result = res.result;
			} 
		}
		})
		return result; 
	},
	//新建分组
	addnewfriendgroup:function(groupname){
		var url = chat.config.url+'/friendgroup/addfriendsgroup.action';
		var data = {name:groupname,userid:chat.config.user.uUID};
		$.post(url,data,function(res){
			if(res.code == 200){
				//刷新分组
				chat.setfriendgroup();
			}
		})
	},
	//删除分组 如果里面有好友就删除失败
	deletefriendgroup:function(friendgroupitem){
		var friendgroupid = friendgroupitem.attr('date_id');
		var data = {groupid:friendgroupid,uuid:chat.config.user.uUID};
		var url = chat.config.url+'/friendgroup/deletefriendsgroup.action';
		$.get(url,data,function(res){
			if(res.code == 200){
				friendgroupitem.remove();
			}else{
				alert('删除失败！该分组中可能存在好友！');
			}
		});
	},
	//设置分组信息
	setfriendgroup:function(){
		var _this = this;
		$('#chat_container .chat_center_box').eq(1).empty();  //不删除事件
		//第二个好友内容块  插入分组块  应该循环赋值添加 ---拼接最后append 
		var friendgroup_item = chatpanle.friendgroup_item;
		var list = this.getfriendgroup();
		if(list.length>0){
			var liststr;
			for(var i=0 ; i<list.length ; i++){
				var a = $(friendgroup_item).attr('date_id',list[i].id);
				a.find('.chat_groupname').text(list[i].name);
				$('#chat_container .chat_center_box').eq(1).append(a);
			}
		}else{
			$('#chat_container .chat_center_box').eq(1).html('<h3>您还没有分组！！！</h3>')
		}
		//删除按钮的事件
		$('#chat_container .chat_center_box .chat_friendgroup_item').append('<button class="chat_deletefriendgroup">删除</button>');
		$('#chat_container .chat_friendgroup_item>.chat_deletefriendgroup').click(function(e){
			e.stopPropagation();//阻止事件冒泡
			//删除分组
			chat.deletefriendgroup($(this).parent());
		});
		//添加按钮
		var a ="<div class='chat_addgroup'><span class='iconfont'>&#xe697</span><input type='text' placeholder='请输入分组名'/></div>";
		$('#chat_container .chat_center_box').eq(1).append(a);
		//添加按钮的事件
		$('#chat_container .chat_center_box .chat_addgroup .iconfont').click(function(){
			//如果input显示并且有值就添加 
			var input = $('#chat_container .chat_addgroup>input');
			if(input.css('display')!='none'){
				var groupname = input.val().trim();
				if(groupname != ''){
					//创建组
					chat.addnewfriendgroup(groupname);
				} 
				//清空值
				input.val('');
				$('#chat_container .chat_addgroup>input').fadeOut();
			}else{
				$('#chat_container .chat_addgroup>input').fadeIn();
			}
			
		});
		//分组的点击事件
		$('#chat_container .chat_friendgroup_item').click(function(){
			 //箭头向下
			 $(this).find('.iconfont').toggleClass('chat_itemon');	
			 $(this).siblings().find('.iconfont').removeClass('chat_itemon') 
			 //先将存放好友的面板friends显示
			 $('#chat_container .chat_center_box').find('.chat_friends').detach();
			 var friends = chatpanle.friends;
			 $(this).has('.chat_itemon').after(friends);
			 $('#chat_container .chat_center_box .chat_friends').slideDown();
			 //如果是展开 在面板中插入好友  如果已经请求过一次且有数据后 再点击不在请求 可以有一个刷新按钮再次请求
			 if($(this).has('.chat_itemon').length>0){
				  var grouid = $(this).attr('date_id');
				 _this.getfriends(grouid,_this.config.user.uUID);
			 }
		});
		//当用户被拖放到分组的事件
		 $('#chat_container .chat_friendgroup_item').on('dragover',function(e){
		 	  $(e.currentTarget).addClass('chat_active');
			   e.originalEvent.preventDefault();
		 }).on('dragleave',function(e){
			  $(e.currentTarget).removeClass('chat_active');
		 });
		 //放入操作
		 $('#chat_container .chat_friendgroup_item').on('drop',function(e){
			 var data = JSON.parse(e.originalEvent.dataTransfer.getData('data')) ; 
			 //获取当前组号
			 var curgroupid = $(this).attr('date_id')
			 if(curgroupid != data.befgroupid){	//不是原来的组就切换
				_this.updatafriendgroup(data.userid,curgroupid);
			 }
			 
		 });
		 
	},
	//修改好友分组信息
	updatafriendgroup:function(touserid,groupid){
		var ask_userid = chat.config.user.uUID;
		var url = chat.config.url+'/friend/updatefriendgroup.action';
		var data = {uuid:chat.config.user.uUID,userid:touserid,groupid:groupid};
		//发起请求
		$.post(url,data,function(res){
			if(res.code == 200){	//成功
				$('#chat_container .chat_friendgroup_item[date_id="'+groupid+'"]').removeClass('chat_active').click();
			}
		})
		
	},
	//获取并设置分组的好友信息
	getfriends:function(groupid,UUID) {
		var _this = this;
		$.ajax({
			url:_this.config.url+'/friend/listall.action',
			data:{groupid:groupid,UUID:UUID},
			type:'post',
			success:function(res) {
				// console.log(res)
				if(res.code == 200){
					//将好友设置进去 应该循环赋值添加  
					var chat_center_box_item = chatpanle.chat_center_box_item;
					for(var i=0,len=res.result.length; i<len;i++){
						var item = res.result[i];
						var a = $(chat_center_box_item);
						//头像 如果有值就插入 没有就默认
						a.find('img').attr('src',chat.config.sourcepath+'chat/img/default.png');
						if(item.headimgpath){
							a.find('img').attr('src',item.headimgpath)
						}
						a.attr('data_id',item.uUID);	
						a.attr('state',1);	//设置为用户
						a.find('.chat_name').text(item.username);	//姓名
						a.find('.chat_mesg').attr('title',item.description).text(item.description);	//描述
						if(item.state == 0){	//不在线设置灰度
							a.addClass('chat_out')
						}
						//设置可拖动
						a.attr('draggable','true');
						$('.chat_friends').append(a);
						
					}
					//用户的拖拽事件
					$('#chat_container .chat_mesg_item').on('dragstart',function(e){
						  //设置被拖动的用户信息
						  var userid = $(this).attr('data_id');
						  var befgroupid = $(this).parent().prev().attr('date_id');
						  data = {
							  type:'user',
							  userid:userid,
							  befgroupid:befgroupid
						  };
						  e.originalEvent.dataTransfer.setData('data',JSON.stringify(data));
						 //设置删除区域显示
						 $('#chat_container .chat_deletebox').show();
					});
					$('#chat_container .chat_mesg_item').on('dragend',function(e){
						//设置删除区域隐藏
						$('#chat_container .chat_deletebox').hide();
					});
 
				}
				//给每个好友添加点击事件
				_this.openchatevent();
			}
		});
	},
	//查找好友搜索
	searchUG:function(){
		var _this = this;
		// console.log($('#search_input').val())
		var searchw = $('#chat_search_input').val().trim();
		
		if(searchw){
			$.ajax({
				url:_this.config.url+"/search/searchug.action",
				data:{searchcontent:searchw},
				success:function(res){
					if(res.code == 200){
						//将结果赋值
						_this.setSearchContent(res.result,'#chat_search_box .chat_search_rscontent',1);
					}else{
						$('#chat_search_box .chat_search_rscontent').html('<center >没有找到任何信息！！！</center>')
					}
				}
			})
		}else{
			$('#chat_search_box .chat_search_rscontent').html('<center>请输入有效信息！！！</center>')
		}
	},
	//将结果显示在查询内容框  addbut 是否加入添加按钮 1 0 
	setSearchContent:function(data,insertdiv,addbut){
		// console.log(data);
		var _this = this;
		//清空
		$(insertdiv).empty();
		var chat_center_box_item = chatpanle.chat_center_box_item;
		//插入用户
		if(data.user &&data.user.length>0){
			$(insertdiv).append('<center>------匹配到以下用户------</center>')
			for(var i=0,len=data.user.length;i<len;i++){
				var item = data.user[i];
				var a = $(chat_center_box_item);
				//头像 如果有值就插入 没有就默认
				a.find('img').attr('src',chat.config.sourcepath+'chat/img/default.png');
				if(item.headimgpath){
					a.find('img').attr('src',item.headimgpath)
				}
				if(addbut == 1){
					//添加按钮
					a.append('<button class="chat_search_add">添加</button>')
				}
				a.attr('user_id',item.uUID);
				a.find('.chat_name').text(item.username);	//姓名
				a.find('.chat_mesg').text(item.description);	//描述
				$(insertdiv).append(a);
			}
		}
		//插入群
		if(data.chatgroup && data.chatgroup.length>0){
			$(insertdiv).append('<center>------匹配到以下群聊------</center>')
			for(var i=0,len=data.chatgroup.length;i<len;i++){
				var item = data.chatgroup[i];
				var a = $(chat_center_box_item);
				//头像 如果有值就插入 没有就默认
				a.find('img').attr('src',chat.config.sourcepath+'chat/img/default.png');
				if(item.headimgpath){
					a.find('img').attr('src',item.headimgpath)
				}
				if(addbut == 1){
					//添加按钮
					a.append('<button class="chat_search_add">添加</button>')
				}
				a.attr('group_id',item.id);
				a.find('.chat_name').text(item.groupname);	//姓名
				a.find('.chat_mesg').text(item.description);	//描述
				$(insertdiv).append(a);
			}
		}
		//添加按钮的事件
		$('#chat_search_box .chat_mesg_item .chat_search_add').click(function(e){
			//获取用户UUID 或者群id
			var user_UUID = $(this).parent().attr('user_id');
			var Group_id = $(this).parent().attr('group_id');
			if(user_UUID != undefined){
				_this.addFriend(user_UUID,$(this),e);
			}
			if(Group_id != undefined){
				_this.addChatGroup(Group_id,$(this));
			}
		});
	},
	//可拖拽功能
	addMove:function(divbox,movebox){
		$(movebox).mousedown(function(e){
			//计算鼠标点击时距离盒子的左上距离
			var left = $(divbox).get(0).offsetLeft;
			var top = $(divbox).get(0).offsetTop;
			var boxleft = e.clientX-left;	
			var boxtop = e.clientY-top;
			$(movebox).mousemove(function(e){
				
				 //获取盒子鼠标在移动过程中的左上距离
				 var left2 = e.clientX-boxleft;
				 var top2 = e.clientY-boxtop;
				 //设置
				 $(divbox).css({top:top2,left:left2});
				 //设置logo的点击事件和移动事件的并存
				 if(Math.abs(left-left2)>1||Math.abs(top-top2)>1){
				 	 chat.config.logoevent = false;
				 }
			});
		 
		});
		//鼠标离开可移动区域  移除鼠标事件
		$(movebox).mouseup(function(){
			$(movebox).unbind('mousemove');
			 chat.config.logoevent = true;
		    if(divbox == '#chatbox'){//如果是系统面板只能靠在顶部
			  $(divbox).css({top:0})
			}
		})
		
	}
}


//这是程序面板的html组件结构
var chatpanle = {
	//大盒子
	chat_all_box:'<div id="chatbox"> <div id="chat_container"> <div class="chat_add"> <span class="iconfont">&#xe612;</span> </div> <div class="chat_close"> <span class="iconfont">&#xe61c;</span> </div> </div> </div>',
	//主页头部
	chat_head:"<div class='chat_chathead'>  <div class='chat_head1'><div class='chat_headimg'> <img  title='点击更换头像'> <input type='file' class='chat_user_headimg' style='display: none;'/> </div> <div class='chat_mes'> <p class='chat_username'></p> <input class='chat_description' title='' />  </div></div> </div>",
	//主页中部面板
	chat_center:"<div class='chat_center'></div>",
	//中部面板的导航栏
	chat_center_nav:"<div class='chat_nav'> <ul> <li class='chat_on'>消息</li> <li>好友</li> <li>群</li> </ul> </div>",
	//导航栏下的内容盒子
	chat_center_box:"<div class='chat_center_box'> </div>",
	//好友，群等内容模块
	chat_center_box_item:"<div class='chat_mesg_item'> <div class='chat_headimg'> <img src=''> </div> <div class='chat_content'> <p class='chat_name'> </p> <p class='chat_mesg'> </p> </div> </div>",
	//好友分组
	friendgroup_item:"<div class='chat_friendgroup_item'> <span class='iconfont'>&#xe60e;</span> <span class='chat_groupname'> </span> </div>",
	//好友面板
	friends:"<div class='chat_friends'> </div>",
	//查找添加面板
	chat_searchbox:"<div id='chat_search_box'> <span class='iconfont' >&#xe61c;</span> <div class='chat_head'>查 找</div> <div class='chat_search_input'> <input type='text' id='chat_search_input' placeholder='输入用户名或账号,群名或群号'/> <input type='button' id='chat_search_input_but' value='查询' /> </div> <div class='chat_search_rscontent'> </div> </div>",
	//聊天界面的大盒子 包括了顶部和中部大盒子
	chat_box:'<div id="chat_message_panel"><div class="chat_message_panel_head"><span class="chat_curuser"></span><span class="iconfont" >&#xe61c;</span> </div> <div class="chat_message_panel_body">	</div></div>',
	//左边的用户群显示
	chat_box_left:'<div class="chat_users"></div>',
	//中间的聊天面板 包括了消息面板和输入框面板
	chat_box_center:'<div class="chat_message_box"> <div class="chat_message"> <ul></ul> </div> <div class="chat_sendmessage_box"> <textarea class="chat_message_textarea" rows="" cols=""></textarea> <button type="button" class="chat_sendmesg_but">发送</button> <button type="button" class="chat_clearmesg_but">清空</button> </div> </div>',
	//消息模块
	message:'<li><div class="chat_message_item"><p><span class="chat_name"> </span> <span></span></p> <div class="chat_message_item_message"> </div> </div> </li>',
	//右边的群成员面板
	chat_box_right:'<div class="chat_chatgroup_member"></div>',
	// 设置好友分组的弹出层
	choosefriendgroup:'<div class="chat_choosefriendgroup"> <select class="chat_choosefriendgroup_select"> </select> <button class="chat_choosefriendgroup_sure">确定</button> <button class="chat_choosefriendgroup_close">取消</button></div>',
	//创建群聊面板
	creatchatgroup:'<div class="chat_addchatgroup"><input type="text" class="chat_addchatgroup_groupname" placeholder="群名称不超过10个字符"/><input type="text" class="chat_addchatgroup_description" placeholder="群描述不超过30个字符" /><input type="file" class="chat_addchatgroup_headimg" style="display: none;"/> <button class="chat_addchatgroup_headimg_but">+</button> <button type="button" class="chat_addchatgroup_submit">创建</button></div>'
}






