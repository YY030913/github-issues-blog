Ractive.DEBUG = false;
function index(page){
    var page = parseInt(page) || 1;
    window._G = window._G || {post: {}, postList: {}};
    $('title').html(_config['blog_name']);
    if(_G.postList[page] != undefined){
      $('#container').html(_G.postList[page]);
      return;
    }

    $.ajax({
        url:"https://api.github.com/repos/"+_config['owner']+"/"+_config['repo']+"/issues",
        data:{
            filter       : 'created',
            page         : page,
            // access_token : _config['access_token'],
            per_page     : _config['per_page']
        },
        beforeSend:function(){
          $('#container').html('<center><p class="loading">LOADING</p></center>');
        },
        success:function(data, textStatus, jqXHR){
            var link = jqXHR.getResponseHeader("Link") || "";
            var next = false;
            var prev = false;
            if(link.indexOf('rel="next"') > 0){
              next = true;
            }
            if(link.indexOf('rel="prev"') > 0){
              prev = true;
            }
            var ractive = new Ractive({
                template : '#listTpl',
                data     : {
                    posts : data,
                    next  : next,
                    prev  : prev,
                    page  : page
                }
            });
            window._G.postList[page] = ractive.toHTML();
            $('#container').html(window._G.postList[page]);

            //将文章列表的信息存到全局变量中，避免重复请求
            for(i in data){
              var ractive = new Ractive({
                  template : '#detailTpl',
                  data     : {post: data[i]}
              });
              window._G.post[data[i].number] = {};
              window._G.post[data[i].number].body = ractive.toHTML();
              
              var title = data[i].title + " * " + _config['blog_name'];
              window._G.post[data[i].number].title = title;
            }
        }
    });
}

function highlight(){
  $('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
  });
}



function detail(id){
    if(!window._G){
      window._G = {post: {}, postList: {}};
      window._G.post[id] = {};  
    }
    
    if(_G.post[id].body != undefined){
      $('#container').html(_G.post[id].body);
      $('title').html(_G.post[id].title);
      highlight();
      return;
    }
    $.ajax({
        url:"https://api.github.com/repos/"+_config['owner']+"/"+_config['repo']+"/issues/" + id,
        data:{
            // access_token:_config['access_token']
        },
        beforeSend:function(){
          $('#container').html('<center><p class="loading">LOADING</p></center>');
        },
        success:function(data){
            var ractive = new Ractive({
                 el: "#container",
                 template: '#detailTpl',
                 data: {post: data}
            });

            $('title').html(data.title + " * " + _config['blog_name']);
            highlight();
        }
    });  

}

var helpers = Ractive.defaults.data;
helpers.markdown2HTML = function(content){
    return marked(content);
}
helpers.formatTime = function(time){
    return time.substr(0,10);
}

var reward = {
	'<button id="rewardButton" disable="enable" onclick="var e=$(&quot;#QR&quot;);e.style.display=&quot;none&quot;===e.style.display?&quot;block&quot;:&quot;none&quot;"><span>打赏</span></button><div id="QR" style="display:none"><div id="wechat" style="display:inline-block"><img id="wechat_qr" src="//ww4.sinaimg.cn/large/a15b4afegw1f9m26qy4gej205k05kgm2" alt="WeChat"><p>微信打赏</p></div><div id="alipay" style="display:inline-block"><img id="alipay_qr" src="//ww4.sinaimg.cn/large/a15b4afegw1f9m26rblkrj205k05kjrc" alt="Alipay"><p>支付宝打赏</p></div></div>'
}

var routes = {
    '/': index,
    'p:page': index,
    'post/:postId': detail
};
var router = Router(routes);
router.init('/');

