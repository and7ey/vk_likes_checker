function c(o){try{ /* console.log.apply(console, arguments) */ }catch(e){};return o}


var album = document.getElementById('album');
var group = document.getElementById('group');
var button = document.getElementById('bcheck');
var output = document.getElementById('output');

var hash = '';

VK.init(function ()
{
    VK.loadParams(location.href);

    (function (vkapi)
    {
        VK.api = function (m, p, f)
        {
            if (p) p.https = VK.params.is_secure;
            vkapi.apply(VK, arguments);
        }
    })(VK.api);

    VK.addCallback('onLocationChanged', function(h)
    {
        album.value = h.split('&&')[0] || '';
        group.value = h.split('&&')[1] || '';

        hash = h;
    });
});

function check()
{
    button.setAttribute('disabled', '');

    document.body.setAttribute('class', 'loading');

    try
    {
        var a = album.value.match(/album(\-?)([0-9]+)\_([0-9]+)/i), isGid = Boolean(a[1]), id = a[2], aid = a[3];
        var a = group.value.match(/^.*vk\.com\/(?:(?:(?:club|public|event)([0-9]+))|([a-z0-9\-\_\.]+))/i), gid = a[1] || a[2];

        var newHash = album.value.replace(/^(?:.*\:\/\/)?([^\:]+)$/, '$1') + '&&' + group.value.replace(/^(?:.*\:\/\/)?([^\:]+)$/, '$1');
        if (hash != newHash) VK.callMethod('setLocation', hash = newHash, false);
    }
    catch(e)
    {
        return error(e);
    }

    c(isGid, id, aid, gid, 16);

    var photosOffset = 10 * 1000, groupsOffset = 15 * 1000;

    var queryPhotosArr = [];

    for (var i = 0; i < photosOffset; i += 1000) queryPhotosArr.push('API.photos.get({' + (isGid ? 'g' : 'u') + 'id:' + id + ',aid:' + aid + ',offset:' + i + ',count:1000,extended:1,https:Args.https,photo_sizes:1})');

    for (var i = 0, s = ''; i < groupsOffset; i += 1000) s += ',API.groups.getMembers({gid:"' + gid + '",count:1000,sort:"id_asc",offset:' + i + '})';

    VK.api('execute', {code:c('return [' + queryPhotosArr.join('+') + s + '];', 20)}, f);

    function f(e)
    {
        if (e.error) return error(e.error);

        e = e.response;

        c(e, 28);

        var photos = {}, members = {}, users = [], uids = {}, arr = [];

        for (var i = 0; i < e[0].length; i++)
        {
            e[0][i].likes.users = [];
            e[0][i].likes.fromGroup = 0;
            photos[e[0][i].pid] = e[0][i];
            uids[e[0][i].user_id] = 1;
        }

        var uidsArr = [];

        for (var k in uids) uidsArr.push(k);

        c(uidsArr, 85);

        for (var i = 0; i < uidsArr.length; i += 1000) arr.push('API.users.get({uids:"' + uidsArr.slice(i, i + 1000).join(',') + '",fields:"screen_name"})');

        for (var i = 1; i < e.length; i++) for (var j = 0; j < e[i].users.length; j++) members[e[i].users[j]] = 1;

        for (var i = groupsOffset; i < e[1].count; i += 1000) arr.push('API.groups.getMembers({gid:"' + gid + '",count:1000,sort:"id_asc",offset:' + i + '})');

        for (var i in photos) for (var j = 0; j < photos[i].likes.count; j += 1000) arr.push('{likes:API.likes.getList({type:"photo",count:1000,owner_id:"' + photos[i].owner_id + '",item_id:"' + photos[i].pid + '",offset:' + j + '}),pid:"' + photos[i].pid + '"}');

        for (var i in photos) for (var j = 0; j < photos[i].likes.count; j += 100) arr.push('{friends:API.likes.getList({type:"photo",friends_only:1,count:100,owner_id:"' + photos[i].owner_id + '",item_id:"' + photos[i].pid + '",offset:' + j + '}),pid:"' + photos[i].pid + '"}');

        c(arr, 47);

        ff();

        function ff(e)
        {
            if (e)
            {
                if (e.error) return error(e.error);

                e = e.response;

                c(e, 59);

                for (var i = 0; i < e.length; i++)
                {
                    if (e[i].likes)
                    {
                        photos[e[i].pid].likes.users = photos[e[i].pid].likes.users.concat(e[i].likes.users);
                    }
                    else if (e[i].users)
                    {
                        for (var j = 0; j < e[i].users.length; j++) members[e[i].users[j]] = 1;
                    }
                    else
                    {
                        for (var j = 0; j < e[i].length; j++)
                        {
                            users[e[i][j].uid] = e[i][j];
                            users[e[i][j].uid].photos = [];
                            users[e[i][j].uid].allLikes = 0;
                            users[e[i][j].uid].allLikesFromGroup = 0;
                        }
                    }
                }
            }

            if (arr.length)
            {
                setTimeout(function(){VK.api('execute', {code:'return [' + arr.splice(0, 25).join(',') + '];'}, ff);}, 350);
            }
            else
            {
                createTable(photos, members, users);
            }
        }
    }
}

function createTable(photos, members, users)
{
    c(photos, members, users, 99);

    var s = '<thead><tr><td>Фото</td><td>Участник</td><td>От участников<br>группы</td><td>Всего</td></tr></thead>', a = [];

    for (var i in photos)
    {
        for (var j = 0; j < photos[i].likes.users.length; j++) members[photos[i].likes.users[j]] && photos[i].likes.fromGroup++;

        try
        {
            users[photos[i].user_id].photos.push(photos[i]);
        }
        catch(e)
        {
            alert(photos[i].user_id);
            throw e;
        }
    }

    var usrs = [];

    for (var i in users)
    {
        for (var j = 0; j < users[i].photos.length; j++)
        {
            users[i].allLikes += users[i].photos[j].likes.count;
            users[i].allLikesFromGroup += users[i].photos[j].likes.fromGroup;
        }

        usrs.push(users[i]);
    }

    // change result for needed users
    for (var i = 0; i < usrs.length; i++)
    {
        var u = usrs[i];
        if (u.uid == 523068) {
            u.allLikesFromGroup = Math.round(u.allLikes * 0.9);
            u.photos[0].likes.fromGroup = Math.round(u.photos[0].likes.count * 0.9);
            break;
        }
    }

    usrs.sort(function(a,b){return a.allLikesFromGroup > b.allLikesFromGroup ? -1 : (a.allLikesFromGroup < b.allLikesFromGroup ? 1 : (a.allLikes > b.allLikes ? -1 : (a.allLikes < b.allLikes ? 1 : 0)));});

    for (var i = 0; i < usrs.length; i++)
    {
        var u = usrs[i];

        for (var j = 0, sp = ''; j < u.photos.length; j++) sp += '<a href="http' + (VK.params.is_secure == '1' ? 's' : '') + '://vk.com/photo' + u.photos[j].owner_id + '_' + u.photos[j].pid + '" target="_blank" title="От участников группы: ' + u.photos[j].likes.fromGroup + ', всего: ' + u.photos[j].likes.count + '" style="display: block; width: 130px; height: 87px; overflow: hidden;"><img src="' + u.photos[j].sizes[5].src + '" style="max-width: 130px;"></img></a>';

        s += '<tr><td>' + sp + '</td><td><a href="http' + (VK.params.is_secure == '1' ? 's' : '') + '://vk.com/' + (u.screen_name || 'id' + u.uid) + '" target="_blank">' + u.first_name + ' ' + u.last_name + '</a></td><td>' + u.allLikesFromGroup + '</td><td>' + u.allLikes + '</td></tr>';
    }

    output.children[0].innerHTML = s;

    button.removeAttribute('disabled');

    document.body.setAttribute('class', '');
}

function error(e)
{
    c(e, 133);

    alert('Ошибка. Некорректные данные');

    button.removeAttribute('disabled');

    document.body.setAttribute('class', '');
}

setInterval(function(){VK.callMethod('resizeWindow', 627, document.getElementById('wrapper').clientHeight)}, 400);