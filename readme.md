# WAChat实时在线聊天
##说明：

   在学习完前端之后结合目前学习的后台技术实现的一个实时在线聊天程序，使用了websocket但是没有考虑他的可承受的连接数，所以只能作为一个小工具。
   作为一个经历过每个学期末的课程设计的煎熬的一个软工大学生。部分项目还是需要一个实时聊天的功能来加加分什么的。
   该程序只适合作为课程设计中前端的一个插件。
   
##功能

1. 好友的基本添加删除和分组功能

2. 好友分组的添加删除

3. 私聊和群聊功能（只实现了文字的信息）

4. 创建和删除群聊

5. 个人的信息修改（头像，描述）

   

## 使用步骤

1. ##### 在要实现的页面上添加结构
```
<html>
	<head>
		<meta charset="utf-8" />
		<title></title>
		<link rel="stylesheet" type="text/css" href="chat/css/chat.min.css"/>
		<script src="chat/js/jquery.min.js" type="text/javascript" charset="utf-8"></script>
	</head>
	<style type="text/css">
	</style>
	<body>
		<!-- 悬浮在右边的聊天logo图标 可自定义  类名不修改 -->
		<div id="chatlogo">
			<span class="iconfont" >&#xe614;</span>
		</div>
		<!--提供的添加好友的按钮操作    class不可修改  user_id 添加的好友uUID -->
		<button class="chat_add_friend" user_id='204b6a6d-4773-44c3-8f42-bfef015977db'>加好友</button>
		<script src="chat/js/chat.min.js" type="text/javascript" charset="utf-8"></script>
		<script type="text/javascript"> 
			var chat = new Chat({
				//用户需要提供一个接口 来提供已登录的用户信息  以及在wachat上申请的一个websign网站标识
				//UUID一个唯一标识 需要参数 uUID username  usercode  
				url:"http://zouhongwei.com:8800/WAChat/user/login.action",
				//资源路径  chat文件夹放置的位置
				sourcepath:''
			});
		</script>
	</body>
</html>
```
2. ##### 添加 chat 文件夹
3. ##### 获取websign标识    每个标识 只允许30个注册用户量

   <http://zouhongwei.com:8800/WAChat/> 

4. ##### 实现接口  修改以上代码中的url参数  返回参数为json   （例子大概写的）

   除了websign其他都是自己实现生成的。

   同一账号的uUID和usercode是惟一的  username可修改

   注意  uUID  大小写不能错   

   ```
   {uUID:"154b6a6d-4773-44c3-8f42-bfef015977db",usercode:"1562813192",username:"张三",websign:"获取的到websign"}
   ```

   java   定义一个实体类user   可用 fastjson  将对象生成json字符串

   ```
   protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
   		// TODO Auto-generated method stub
   		 response.setContentType("text/json;charset=UTF-8 ");
   		 
   		 String UUID = "154b6a6d-4773-44c3-8f42-bfef015977db";
   		 String username = "李四";
   		 user u =new  user(UUID,username,"zouhongwei","1562813995");
   		 String json = JSON.toJSONString(u);
   		 response.getWriter().write(json);
   	}
   ```

   php 

   ```
   if(session('user')){
       $data = array(
           'uUID'=>'154b6a6d-4773-44c3-8f42-bfef015977db',
           'username'=>'张三',
           'usercode'=>'1562813995',
           'websign'=>'zouhongwei.com'
       );
       echo  json_encode($data);
   }
   ```


## 图片展示

主面板（点击头像换头像，点击描述修改）![主面板](http://img.zouhongwei.com/a1.png)

聊天面板![聊天面板](http://img.zouhongwei.com/a3.png)

搜索面板![搜索面板](http://img.zouhongwei.com/a2.png)

拖拽删除好友和群（也可拖拽更换分组）![](http://img.zouhongwei.com/b1.png)

创建群加好添加头像![](http://img.zouhongwei.com/b2.png)



## 最后

本人测试过一两次，可能会出现各种问题，大家可以试试还有其他小功能就不说了。

提供有压缩版和原版带注释的css和js 文件，代码不规范也没优化。

刚开始想了好多功能，但是后面因为时间原因只是为了实践学过的知识点，所以不会再继续做下去。

