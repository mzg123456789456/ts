// 订阅地址：http://域名/订阅路径

// 路径传参介绍
// 示例/ip=192.168.1.1或者/alls5=true&s5=admin:admin@43.199.42.233:1080
// 通用路径传参/ip=&alls5=&s5=
// ip=是反代，s5=是socks5，alls5=true是全局socks5

import { connect } from "cloudflare:sockets";
let 路径ID = "123456"; // 订阅路径
let 密钥VL = 'd342d11e-d424-4583-b36e-524ab1f0afa4';
let 优选IP = [
  '[2606:4700::]:443#IPV6美国',
  '104.27.0.0:443#IPV4美国',
];
let 优选TXT = [];
let 反代IP = [
  'ProxyIP.US.CMLiussss.net',
  'ProxyIP.Vultr.CMLiussss.net',
  'ProxyIP.Multacom.CMLiussss.net'
];
let 全局SOCKS5 = false;
let 反代SOCKS5 = [
  'admin:admin@43.199.42.233:1080',
];
let 默认名称 = '两皮坨';
let 通 = 'vl', 用 = 'ess', 猫 = 'cla', 咪 = 'sh', 符号 = '://';

export default {
  async fetch(访问请求) {
    const 升级标头 = 访问请求.headers.get("Upgrade");
    const 请求URL = new URL(访问请求.url);
    try {
      if (!升级标头 || 升级标头 !== "websocket") {
        switch (请求URL.pathname) {
          case `/${路径ID}`:
            return new Response(生成订阅页面(路径ID, 访问请求.headers.get('Host')), { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
          case `/${路径ID}/${通}${用}`: {
            const 节点列表 = await 获取合并节点列表();
            return new Response(生成通用配置文件(访问请求.headers.get('Host'), 节点列表), { status: 200, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
          }
          case `/${路径ID}/${猫}${咪}`: {
            const 节点列表 = await 获取合并节点列表();
            return new Response(生成猫咪配置文件(访问请求.headers.get('Host'), 节点列表), { status: 200, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
          } default: return new Response('Hello World!', { status: 200 });
        }
      }
      return await 处理VL协议WebSocket(访问请求, 请求URL);
    } catch (错误) {
      let 异常 = 错误;
      return new Response(异常.toString());
    }
  },
};

async function 处理VL协议WebSocket(访问请求, 请求URL) {
  const WebSocket对 = new WebSocketPair();
  const [客户端WS, 服务端WS] = Object.values(WebSocket对);
  服务端WS.accept();
  const 早期数据标头 = 访问请求.headers.get('sec-websocket-protocol') || '';
  const WS可读流 = 创建WebSocket可读流(服务端WS, 早期数据标头);
  let 远程套接字 = null;

  const 初始数据 = WS可读流; // Note: This assumes WS可读流 can be used as initial data; adjust if needed
  const 查询参数 = 参数名 => 请求URL.searchParams.get(参数名) || new URLSearchParams((请求URL.pathname.match(/\/([^\/]+=[^\/]*)$/)?.[1] || '')).get(参数名);
  const 连接方式列表 = [
    ...(((全局S5 || 查询参数('alls5') === 'true') ? (查询参数('s5') || 反代S5.join(',')) : '').split(',').filter(Boolean).map(s5 => ({ 方式: 'S5', 参数: s5.trim() }))),
    { 方式: '直连' },
    ...(查询参数('ip')?.split(',').filter(Boolean).map(ip => ({ 方式: '代理', 参数: ip.trim() })) || []),
    ...(查询参数('s5')?.split(',').filter(Boolean).map(s5 => ({ 方式: 'S5', 参数: s5.trim() })) || []),
    ...反代IP.map(ip => ({ 方式: '代理', 参数: ip })),
    ...反代S5.map(s5 => ({ 方式: 'S5', 参数: s5 }))
  ];

  WS可读流.pipeTo(new WritableStream({
    async write(数据块) {
      if (远程套接字) {
        const 写入器 = 远程套接字.writable.getWriter();
        await 写入器.write(数据块);
        写入器.releaseLock();
        return;
      }
      const 解析结果 = 解析VL协议头(数据块, 密钥VL);
      if (解析结果.hasError) {
        throw new Error(解析结果.message);
      }
      const VL响应头 = new Uint8Array([解析结果.vlessVersion[0], 0]);
      const 原始客户端数据 = 数据块.slice(解析结果.rawDataIndex);
      const 目标主机 = 解析结果.addressRemote;
      const 端口号 = 解析结果.portRemote;
      const 偏移量 = 解析结果.rawDataIndex;

      const 尝试连接 = async (连接方式, 连接参数) => {
        try {
          if (连接方式 === '直连') {
            const 套接字 = await connect({ hostname: 目标主机, port: 端口号 });
            await 套接字.opened;
            return { TCP套接字: 套接字, 初始数据: 原始客户端数据 };
          }
          if (连接方式 === '代理') {
            const [代理主机, 代理端口] = 连接参数.split(':');
            const 套接字 = await connect({ hostname: 代理主机, port: Number(代理端口) || 端口号 });
            await 套接字.opened;
            return { TCP套接字: 套接字, 初始数据: 原始客户端数据 };
          }
          if (连接方式 === 'SOCKS5') {
            let 识别地址类型;
            if (/^\d+\.\d+\.\d+\.\d+$/.test(目标主机)) { 识别地址类型 = 1; }
            else if (目标主机.includes(':')) { 识别地址类型 = 3; }
            else { 识别地址类型 = 2; }
            const 套接字 = await 创建SOCKS5接口(识别地址类型, 目标主机, 端口号, 连接参数);
            if (!套接字) throw new Error('SOCKS5连接失败');
            return { TCP套接字: 套接字, 初始数据: 原始客户端数据 };
          }
        } catch {}
      };

      for (const { 方式, 参数 } of 连接方式列表) {
        const 结果 = await 尝试连接(方式, 参数);
        if (结果) {
          远程套接字 = 结果.TCP套接字;
          const 写入器 = 远程套接字.writable.getWriter();
          await 写入器.write(结果.初始数据);
          写入器.releaseLock();
          管道远程到WebSocket(远程套接字, 服务端WS, VL响应头);
          return;
        }
      }
      throw new Error('所有连接方式均失败');
    },
    close() {
      if (远程套接字) {
        远程套接字?.close();
      }
    }
  })).catch(错误 => {
    console.error('WebSocket 错误:', 错误);
    远程套接字?.close();
    服务端WS.close(1011, '内部错误');
  });

  return new Response(null, {
    status: 101,
    webSocket: 客户端WS,
  });
}

async function 创建SOCKS5接口(识别地址类型, 访问地址, 访问端口, SOCKS5) {
  const { 账号, 密码, 地址, 端口 } = await 获取SOCKS5账号(SOCKS5);
  const SOCKS5接口 = connect({ hostname: 地址, port: 端口 });
  await SOCKS5接口.opened;
  const 传输数据 = SOCKS5接口.writable.getWriter();
  const 读取数据 = SOCKS5接口.readable.getReader();
  const 转换数组 = new TextEncoder();
  const 构建S5认证 = new Uint8Array([5, 2, 0, 2]);
  await 传输数据.write(构建S5认证);
  const 读取认证要求 = (await 读取数据.read()).value;
  if (读取认证要求[1] === 0x02) {
    if (!账号 || !密码) throw new Error('SOCKS5代理需要账号密码');
    const 构建账号密码包 = new Uint8Array([1, 账号.length, ...转换数组.encode(账号), 密码.length, ...转换数组.encode(密码)]);
    await 传输数据.write(构建账号密码包);
    const 读取账号密码认证结果 = (await 读取数据.read()).value;
    if (读取账号密码认证结果[0] !== 0x01 || 读取账号密码认证结果[1] !== 0x00) throw new Error('SOCKS5账号密码认证失败');
  }
  let 转换访问地址;
  switch (识别地址类型) {
    case 1: 转换访问地址 = new Uint8Array([1, ...访问地址.split('.').map(Number)]); break;
    case 2: 转换访问地址 = new Uint8Array([3, 访问地址.length, ...转换数组.encode(访问地址)]); break;
    case 3: 转换访问地址 = new Uint8Array([4, ...访问地址.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]); break;
  }
  const 构建转换后的访问地址 = new Uint8Array([5, 1, 0, ...转换访问地址, 访问端口 >> 8, 访问端口 & 0xff]);
  await 传输数据.write(构建转换后的访问地址);
  const 检查返回响应 = (await 读取数据.read()).value;
  if (检查返回响应[0] !== 0x05 || 检查返回响应[1] !== 0x00) throw new Error('SOCKS5连接目标失败');
  传输数据.releaseLock();
  读取数据.releaseLock();
  return SOCKS5接口;
}

async function 获取SOCKS5账号(SOCKS5) {
  const 分隔符位置 = SOCKS5.lastIndexOf('@');
  const [账号段, 地址段] = 分隔符位置 !== -1 ? [SOCKS5.slice(0, 分隔符位置), SOCKS5.slice(分隔符位置 + 1)] : ['', SOCKS5];
  const 冒号位置 = 账号段.lastIndexOf(':');
  const [账号, 密码] = 冒号位置 !== -1 ? [账号段.slice(0, 冒号位置), 账号段.slice(冒号位置 + 1)] : [账号段, ''];
  const [地址, 端口] = 解析地址端口(地址段);
  return { 账号, 密码, 地址, 端口 };
}

function 解析地址端口(地址段) {
  let 地址, 端口;
  if (地址段.startsWith('[')) {
    [地址, 端口 = 443] = 地址段.slice(1, -1).split(']:');
  } else {
    [地址, 端口 = 443] = 地址段.split(':');
  }
  return [地址, Number(端口)];
}

// [Rest of the original code remains unchanged: 创建WebSocket可读流, 解析VL协议头, 管道远程到WebSocket, 格式化UUID, 生成订阅页面, 获取合并节点列表, 解析节点项, 生成通用配置文件, 生成猫咪配置文件]
function 创建WebSocket可读流(WS, 早期数据标头) {
  return new ReadableStream({
    start(控制器) {
      WS.addEventListener('message', 事件 => {
        控制器.enqueue(事件.data);
      });
      WS.addEventListener('close', () => {
        控制器.close();
      });
      WS.addEventListener('error', 错误 => {
        控制器.error(错误);
      });
      if (早期数据标头) {
        try {
          const 解码数据 = atob(早期数据标头.replace(/-/g, '+').replace(/_/g, '/'));
          const 数据 = Uint8Array.from(解码数据, c => c.charCodeAt(0));
          控制器.enqueue(数据.buffer);
        } catch (异常) {
          console.error("Error decoding early data:", 异常);
          控制器.error(异常);
        }
      }
    },
    cancel(原因) {
      console.log('ReadableStream cancelled', 原因);
      WS.close();
    }
  });
}

function 解析VL协议头(缓冲区, 密钥VL) {
  if (缓冲区.byteLength < 24) {
    return { hasError: true, message: '无效的头部长度' };
  }
  const 视图 = new DataView(缓冲区);
  const 版本 = new Uint8Array(缓冲区.slice(0, 1));
  const UUID = 格式化UUID(new Uint8Array(缓冲区.slice(1, 17)));
  if (UUID !== 密钥VL) {
    return { hasError: true, message: '无效的用户' };
  }
  const 选项长度 = 视图.getUint8(17);
  const 命令 = 视图.getUint8(18 + 选项长度);
  if (命令 === 1) {
  } else {
    return { hasError: true, message: '不支持的命令,仅支持TCP(01)' };
  }
  let 偏移量 = 19 + 选项长度;
  const 端口 = 视图.getUint16(偏移量);
  偏移量 += 2;
  const 地址类型 = 视图.getUint8(偏移量++);
  let 地址 = '';
  switch (地址类型) {
    case 1: // IPv4
      地址 = Array.from(new Uint8Array(缓冲区.slice(偏移量, 偏移量 + 4))).join('.');
      偏移量 += 4;
      break;
    case 2: // 域名
      const 域名长度 = 视图.getUint8(偏移量++);
      地址 = new TextDecoder().decode(缓冲区.slice(偏移量, 偏移量 + 域名长度));
      偏移量 += 域名长度;
      break;
    case 3: // IPv6
      const IPv6 = [];
      for (let i = 0; i < 8; i++) {
        IPv6.push(视图.getUint16(偏移量).toString(16).padStart(4, '0'));
        偏移量 += 2;
      }
      地址 = IPv6.join(':').replace(/(^|:)0+(\w)/g, '$1$2');
      break;
    default:
      return { hasError: true, message: '不支持的地址类型' };
  }
  return {
    hasError: false,
    addressRemote: 地址,
    portRemote: 端口,
    rawDataIndex: 偏移量,
    vlessVersion: 版本,
  };
}

function 管道远程到WebSocket(远程套接字, WS, VL头部, 重试 = null) {
  let 头部已发送 = false;
  let 有传入数据 = false;
  远程套接字.readable.pipeTo(new WritableStream({
    write(数据块) {
      有传入数据 = true;
      if (WS.readyState === 1) {
        if (!头部已发送) {
          const 合并数据 = new Uint8Array(VL头部.byteLength + 数据块.byteLength);
          合并数据.set(new Uint8Array(VL头部), 0);
          合并数据.set(new Uint8Array(数据块), VL头部.byteLength);
          WS.send(合并数据.buffer);
          头部已发送 = true;
        } else {
          WS.send(数据块);
        }
      }
    },
    close() {
      if (!有传入数据 && 重试) {
        重试();
        return;
      }
      if (WS.readyState === 1) {
        WS.close(1000, '正常关闭');
      }
    },
    abort() {
      远程套接字?.close();
    }
  })).catch(错误 => {
    console.error('数据转发错误:', 错误);
    远程套接字?.close();
    if (WS.readyState === 1) {
      WS.close(1011, '数据传输错误');
    }
  });
}

function 格式化UUID(字节数组) {
  const 十六进制 = Array.from(字节数组, b => b.toString(16).padStart(2, '0')).join('');
  return `${十六进制.slice(0, 8)}-${十六进制.slice(8, 12)}-${十六进制.slice(12, 16)}-${十六进制.slice(16, 20)}-${十六进制.slice(20)}`;
}

function 生成订阅页面(订阅ID, 主机名) {
  return `<p>天书TG订阅中心</p>
订阅链接<br>
----------------<br>
通用：https${符号}${主机名}/${订阅ID}/${通}${用}<br>
猫咪：https${符号}${主机名}/${订阅ID}/${猫}${咪}<br><br>
使用说明<br>
----------------<br>
1. 通用订阅：支持V2RayN、Shadowrocket等客户端<br>
2. 猫咪订阅：专为Clash系列客户端设计
`;
}

async function 获取合并节点列表() {
  if (!优选TXT || 优选TXT.length === 0) return 优选IP;
  const 所有节点 = [...优选IP];
  for (const 链接 of 优选TXT) {
    try {
      const 响应 = await fetch(链接);
      const 文本内容 = await 响应.text();
      const 节点列表 = 文本内容.split('\n').map(行 => 行.trim()).filter(行 => 行);
      所有节点.push(...节点列表);
    } catch {}
  }
  return 所有节点;
}

function 解析节点项(节点项, 节点计数, 默认节点名) {
  const [主要部分, TLS标志] = 节点项.split('@');
  let [地址端口, 节点名称 = 默认节点名] = 主要部分.split('#');
  if (节点计数[节点名称] === undefined) 节点计数[节点名称] = 0;
  else 节点名称 = `${节点名称}-${++节点计数[节点名称]}`;
  const 分割数组 = 地址端口.split(':');
  const 端口号 = 分割数组.length > 1 ? Number(分割数组.pop()) : 443;
  const 主机地址 = 分割数组.join(':');
  return { 主机地址, 端口号, 节点名称, TLS标志 };
}

function 生成通用配置文件(主机名, 节点列表) {
  if (节点列表.length === 0) 节点列表.push(`${主机名}:443#备用节点`);
  const 节点计数 = {};
  return 节点列表.map(节点项 => {
    const { 主机地址, 端口号, 节点名称, TLS标志 } = 解析节点项(节点项, 节点计数, 默认名称);
    const 安全选项 = TLS标志 === 'notls' ? 'security=none' : 'security=tls';
    return `${通}${用}${符号}${密钥VL}@${主机地址}:${端口号}?encryption=none&${安全选项}&sni=${主机名}&type=ws&host=${主机名}&path=%2F%3Fed%3D2560#${节点名称}`;
  }).join('\n');
}

function 生成猫咪配置文件(主机名, 节点列表) {
  if (节点列表.length === 0) 节点列表.push(`${主机名}:443#备用节点`);
  const 节点计数 = {};
  const 节点配置数组 = 节点列表.map(节点项 => {
    const { 主机地址, 端口号, 节点名称, TLS标志 } = 解析节点项(节点项, 节点计数, 默认名称);
    let 格式化地址 = 主机地址.replace(/^\[|\]$/g, '');
    if (格式化地址.includes(':')) 格式化地址 = `'${格式化地址}'`;
    return {
      节点配置: `- name: ${节点名称}
  type: ${通}${用}
  server: ${格式化地址}
  port: ${端口号}
  uuid: ${密钥VL}
  udp: false
  tls: ${TLS标志 === 'notls' ? 'false' : 'true'}
  sni: ${主机名}
  network: ws
  ws-opts:
    path: '/?ed=2560'
    headers:
      Host: ${主机名}`,
      代理配置: `    - ${节点名称}`
    };
  });
  const 节点配置字符串 = 节点配置数组.map(节点 => 节点.节点配置).join('\n');
  const 代理配置字符串 = 节点配置数组.map(节点 => 节点.代理配置).join('\n');
  return `port: 7890
socks-port: 7891
allow-lan: true
mode: Rule
log-level: info
external-controller: 127.0.0.1:9090
dns:
  default-nameserver:
  - 223.5.5.5
  - 223.6.6.6
  fallback:
  - tls://8.8.8.8:853
  - tls://1.1.1.1:853
proxies:
${节点配置字符串}
proxy-groups:
- name: 节点选择
  type: select
  proxies:
    - 自动选择
    - DIRECT
${代理配置字符串}
- name: 自动选择
  type: url-test
  url: http://www.gstatic.com/generate_204
  interval: 60
  tolerance: 30
  proxies:
${代理配置字符串}
- name: 漏网之鱼
  type: select
  proxies:
    - 节点选择
    - DIRECT
rules:
- GEOIP,LAN,DIRECT
- GEOIP,CN,DIRECT
- MATCH,漏网之鱼
`;
}
