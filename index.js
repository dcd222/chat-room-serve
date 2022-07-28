const express = require('express');
const SocketServer = require('ws').Server;

const PORT = 8888;

const server = express().listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new SocketServer({ server });

let num = 1;

let map = {};

// 给除发送人以外所有人发送消息
const sendAll = (message, sender) => {
    Object.keys(map).forEach(key => {
        if (key != sender) {
            map[key].ws.send(JSON.stringify({
                message: `${sender}: ${message}`,
                sender,
                img: map[sender] ? map[sender].img : '',
            }))
        }
    })
}

wss.on('connection', ws => {
    let name = `游客${num}`;
    let isActive = true;
    // 随机获取图片
    let img = `http://dcdawyx.com/imgs/avatar${Math.ceil(Math.random()*41)}.png`;
    num ++;
    map[name] = {
        ws,
        img,
        name
    };

    sendAll(`${name} 进入了房间`, 'system');
    // 告诉他你是谁
    ws.send(JSON.stringify({
        message: name,
        sender: 'userinfo',
        img,
    }));

    let intervalID = setInterval(() => {
        // 定时检测是否在线，60秒内没有ping信息就认为离线
        if (!isActive) {
            ws.close();
            clearInterval(intervalID);
        } else {
            isActive = false;
        }
    }, 60000);

    ws.on('close', () => {
        sendAll(`${name} 离开了房间`, 'system');
        delete map[name];

    });

    ws.on('message', (message) => {
        let msg = message.toString();
        if (msg == 'ping') {
            isActive = true;
        } else {
            sendAll(msg, name);
        }
    });
});