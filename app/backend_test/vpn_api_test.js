
/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

const test_backend_params = [
	{ ip: `${location.host.split(':')[0]}`, port: 44000 },
	{ ip: `${location.host.split(':')[0]}`, port: 44001 },
];

const test_spis = [
400003070,
400104410,
200207348,
500301890,
500402199,
300502139,
400602426,
400708479,
300805665,
400901472,
301009435,
401106707,
401205435,
301303269,
301406900,
301502402,
401601349,
401704650,
301800861,
301900777,
202008579,
302101613,
302200194,
302305670,
402408085,
502502375,
502602746,
402704755,
402804684,
302903838,
403003680,
403101190,
403208090,
503300140,
303405515,
403505102,
203607811,
303705118,
303803896,
303902208,
204007608,
304104905,
304209998,
304306273,
404402269,
404508023,
404600604,
404707181,
404806115,
404903176,
405006388,
305103387,
305202415,
305307779,
305405642,
305509382,
305605491,
505701509,
305802082,
405906165,
406008602,
306103503,
206208116,
306309961,
406401973,
306506761,
506603108,
306707234,
506801852,
506903451
];

const test_cipher_keys = [
`e00007af57c457839f573ebbc64c7423301fd556`,
`b001047472a30e67fda11c63689c453434bdf8df`,
`7002045946001e77132b5ce2d1e37726c0ee60b3`,
`500303cdfe5262f29e75e820a276d848f373a114`,
`d0040c6be1e6a72e594b45eacdcbed7791f5ddcd`,
`d00508e1e837e99a0af720cab7b7b95bc32e9887`,
`60060f9f062f3fc5becf0087403975f05c258329`,
`600701fdd3944427b6184f9fde58fa2cf3e5bd21`,
`00080c4f213e94cd39e9e91869142ef614308417`,
`20090868a8f33d7f80d7c62173fee43322b34016`,
`601007d98847a586a1e876630e82964341d32370`,
`101101e4842b17ddbc7faeab424f1458389a3df2`,
`b0120ec3571880d1a4b4bce44826236238c2cb91`,
`801307979231a63e6666464416692cdfa19f3c02`,
`001404d419fd3d33b628cc05f1d08f2d70cc49c6`,
`1015041a41a5975506c1eb758c1977be5e16b825`,
`10160c53c542a387b7bd5fc90d8fe0cd3e768c1b`,
`8017013bb812ae776f6cb6415b2d79625812aac4`,
`101801afc8f139473cc068321d79d135e9baaac2`,
`60190423a37834084e0c02d5558c58b79235bc86`,
`10200250086fccbaf96bb0d9f82ca9c02281a062`,
`f0210dcd68887146b52b5dbc7b992da02ab6dbc7`,
`202207671a8db89d0b8f1d71a98b66df3282e47f`,
`40230a170a658f53b6f1ad6108fe1282d8807a63`,
`a0240a6a4e3115e60acfe04cb81c302dac8371c2`,
`40250550186955192a136eb19ad20624a070bec6`,
`70260642039b15d104ea0ea6d6c3b67393e92826`,
`d0270f280d61c2fbb8b5ac52a6bcefc68567dcf7`,
`c02808c369cbb0f3ab444d544275ab236418c6e8`,
`802905e465532b572b0a5acc02ec981b2bb9a5ce`,
`a0300eb21e816cb7330b36f3c63c39990d51d209`,
`103104f76a5641e123b41fcc97561282158a52b7`,
`c0320937cbc34bb0ecc4ba60eab772d9290e1cfa`,
`a03306d73efbc722ad278f319bd93d9c69c6e2ac`,
`b0340498b218dbe4bf92ba1d732dd7c185327466`,
`f035038b399700796b4033276a17390666eb398c`,
`a0360d0b350f1359fb76e97b8158391abedba321`,
`e03702ceb2bceeb2732db512e1bfe6aad547ca11`,
`e038064d8f57c1f8bce8e6052c7081af82062041`,
`20390407110ee436dbaf3ab02c823631d53a2c01`,
`3040076c29097c49a1c3126541ea297b58eeb561`,
`5041039760c749c6a377ae4cd196848092d14595`,
`204202490cf70a8d05b9c4f1ee8cced23a672c8d`,
`a043017e1ab203746b51cbe01c2781c7c5a89607`,
`204406ecb975b152164f96e52c3fef9cb8d15867`,
`80450850ffcc4a3c5e4581df7a3fda61825e0388`,
`80460d08b841b5e99cc3d5b91b4c75ad51c77428`,
`1047037bef38b27f485f764ecb9790322337c74f`,
`804802d4b1082ed0eeb54585922accd16158f96e`,
`f049043f2c538b6643bc994ec8d417a3feb59f56`,
`c0500562912becac19ac44e3baef33d229abe85d`,
`00510c23e21cfc1556be7843cd340ddb5c4642cc`,
`f05206c1cca3025a316a16c2b2731a2c5231b7ea`,
`10530b7d2eca0d19c95943acdabc6415a4d1d8d3`,
`40540253b9a3c9bb05557e9106297f579d970b1a`,
`d0550bb8452bea1c8982dc2583be7dbdab79fa85`,
`a0560826bda58e987dee186dab6cbc94ac2f85a5`,
`60570d7817ba77b8eadad1705f0b57ae49dea302`,
`90580ccf5f80f9523cc38a41686d7e0e1044c67e`,
`00590d5e9f5f63069c67b7b993a4e17aa6aae546`,
`f0600d42876d9eb0f0d8b211301ee8664bd5e111`,
`4061088129ad348759d60639bf7628e340a38e54`,
`0062082f054c6e23a80678626a212a4f12c64581`,
`0063023c75c3df03ac8dfd2de3e851bf7cd2682a`,
`b0640ca3a936c45e8f944d5e70fe8c2b38caa69a`,
`10650bf9ffe972b9fec4ebb67680970c86827efa`,
`d0660f6da2f012941998ec778bfbf0fff5d9b8af`,
`a067010ba0938c28246304388ce2d67440565da9`,
`f0680c5f43931a39fef4ba275e48a8ccb06d5a04`,
`80690d8dbfd1b0aba7304b43d1e385058689fc4a`
];

const test_inbound_next_hop_macs = [
[
	[`05:00:45:74:23:30`,`07:00:af:57:c7:83`,`09:00:f5:73:eb:7b`,`0c:00:64:c7:42:33`],
	[`0a:01:30:45:34:34`,`04:01:74:72:ae:67`,`0f:01:da:11:c6:13`,`06:01:89:c4:53:43`],
	[`02:02:01:77:26:c0`,`04:02:59:46:0e:77`,`01:02:32:b5:ce:b2`,`0d:02:1e:37:72:6c`],
	[`07:03:26:d8:48:f3`,`03:03:cd:fe:52:f2`,`09:03:e7:5e:82:50`,`0a:03:27:6d:84:8f`],
	[`04:04:6a:ed:77:91`,`0c:04:6b:e1:e7:2e`,`05:04:94:b4:5e:ba`,`0c:04:dc:be:d7:79`],
	[`0f:05:7e:b9:5b:c3`,`08:05:e1:e8:39:9a`,`00:05:af:72:0c:7a`,`0b:05:7b:7b:95:bc`],
	[`0c:06:f3:75:f0:5c`,`0f:06:9f:06:2f:c5`,`0b:06:ec:f0:08:f7`,`04:06:03:97:5f:05`],
	[`01:07:44:fa:2c:f3`,`01:07:fd:d3:94:27`,`0b:07:61:84:f9:8f`,`0d:07:e5:8f:a2:cf`],
	[`0e:08:e9:2e:f6:14`,`0c:08:4f:21:34:cd`,`03:08:9e:9e:91:98`,`06:08:91:42:ef:61`],
	[`0d:09:33:e4:33:22`,`08:09:68:a8:fd:7f`,`08:09:0d:7c:62:71`,`07:09:3f:ee:43:32`],
	[`0e:10:7a:96:43:41`,`07:10:d9:88:45:86`,`0a:10:1e:87:66:83`,`00:10:e8:29:64:34`],
	[`07:11:b1:14:58:38`,`01:11:e4:84:27:dd`,`0b:11:c7:fa:ea:fb`,`04:11:24:f1:45:83`],
	[`0b:12:88:23:62:38`,`0e:12:c3:57:10:d1`,`0a:12:4b:4b:ce:44`,`04:12:82:62:36:23`],
	[`06:13:1a:2c:df:a1`,`07:13:97:92:36:3e`,`06:13:66:64:64:64`,`01:13:66:92:cd:fa`],
	[`02:14:d3:8f:2d:70`,`04:14:d4:19:fd:33`,`0b:14:62:8c:c0:85`,`0f:14:1d:08:f2:d7`],
	[`0c:15:59:77:be:5e`,`04:15:1a:41:a7:55`,`00:15:6c:1e:b7:15`,`08:15:c1:97:7b:e5`],
	[`0b:16:2a:e0:cd:3e`,`0c:16:53:c5:43:87`,`0b:16:7b:d5:fc:d9`,`00:16:d8:fe:0c:d3`],
	[`06:17:2a:79:62:58`,`01:17:3b:b8:1e:77`,`06:17:f6:cb:64:c1`,`05:17:b2:d7:96:25`],
	[`0c:18:13:d1:35:e9`,`01:18:af:c8:f9:47`,`03:18:cc:06:83:02`,`01:18:d7:9d:13:5e`],
	[`00:19:83:58:b7:92`,`04:19:23:a3:74:08`,`04:19:e0:c0:2d:c5`,`05:19:58:c5:8b:79`],
	[`06:20:fc:a9:c0:22`,`02:20:50:08:6c:ba`,`0f:20:96:bb:0d:b9`,`0f:20:82:ca:9c:02`],
	[`02:21:87:2d:a0:2a`,`0d:21:cd:68:81:46`,`0b:21:52:b5:db:bc`,`07:21:b9:92:da:02`],
	[`08:22:db:66:df:32`,`07:22:67:1a:88:9d`,`00:22:b8:f1:d7:f1`,`0a:22:98:b6:6d:f3`],
	[`0f:23:58:12:82:d8`,`0a:23:17:0a:6f:53`,`0b:23:6f:1a:d6:11`,`00:23:8f:e1:28:2d`],
	[`0c:24:11:30:2d:ac`,`0a:24:6a:4e:35:e6`,`00:24:ac:fe:04:fc`,`0b:24:81:c3:02:da`],
	[`01:25:95:06:24:a0`,`05:25:50:18:65:19`,`02:25:a1:36:eb:31`,`09:25:ad:20:62:4a`],
	[`0e:26:b1:b6:73:93`,`06:26:42:03:95:d1`,`00:26:4e:a0:ea:a6`,`0d:26:6c:3b:67:39`],
	[`0b:27:1c:ef:c6:85`,`0f:27:28:0d:62:fb`,`0b:27:8b:5a:c5:52`,`0a:27:6b:ce:fc:68`],
	[`04:28:bb:ab:23:64`,`08:28:c3:69:c0:f3`,`0a:28:b4:44:d5:44`,`04:28:27:5a:b2:36`],
	[`00:29:32:98:1b:2b`,`05:29:e4:65:5b:57`,`02:29:b0:a5:ac:ac`,`00:29:2e:c9:81:b2`],
	[`00:30:16:39:99:0d`,`0e:30:b2:1e:8c:b7`,`03:30:30:b3:6f:b3`,`0c:30:63:c3:99:90`],
	[`0b:31:64:12:82:15`,`04:31:f7:6a:51:e1`,`02:31:3b:41:fc:4c`,`09:31:75:61:28:21`],
	[`0c:32:34:72:d9:29`,`09:32:37:cb:cb:b0`,`0e:32:cc:4b:a6:40`,`0e:32:ab:77:2d:92`],
	[`02:33:bc:3d:9c:69`,`06:33:d7:3e:f7:22`,`0a:33:d2:78:f3:71`,`09:33:bd:93:d9:c6`],
	[`09:34:8d:d7:c1:85`,`04:34:98:b2:1b:e4`,`0b:34:f9:2b:a1:2d`,`07:34:32:dd:7c:18`],
	[`04:35:70:39:06:66`,`03:35:8b:39:90:79`,`06:35:b4:03:32:07`,`06:35:a1:73:90:66`],
	[`07:36:f1:39:1a:be`,`0d:36:0b:35:03:59`,`0f:36:b7:6e:97:6b`,`08:36:15:83:91:ab`],
	[`02:37:ce:e6:aa:d5`,`02:37:ce:b2:be:b2`,`07:37:32:db:51:d2`,`0e:37:1b:fe:6a:ad`],
	[`0e:38:7c:81:af:82`,`06:38:4d:8f:51:f8`,`0b:38:ce:8e:60:85`,`02:38:c7:08:1a:f8`],
	[`0a:39:ee:36:31:d5`,`04:39:07:11:04:36`,`0d:39:ba:f3:ab:f0`,`02:39:c8:23:63:1d`],
	[`0c:40:97:29:7b:58`,`07:40:6c:29:0c:49`,`0a:40:1c:31:26:35`,`04:40:1e:a2:97:b5`],
	[`07:41:74:84:80:92`,`03:41:97:60:c9:c6`,`0a:41:37:7a:e4:7c`,`0d:41:19:68:48:09`],
	[`0b:42:70:ce:d2:3a`,`02:42:49:0c:fa:8d`,`00:42:5b:9c:4f:91`,`0e:42:e8:cc:ed:23`],
	[`05:43:20:81:c7:c5`,`01:43:7e:1a:b3:74`,`06:43:b5:1c:be:10`,`01:43:c2:78:1c:7c`],
	[`04:44:5b:ef:9c:b8`,`06:44:ec:b9:71:52`,`01:44:64:f9:6e:f5`,`02:44:c3:fe:f9:cb`],
	[`04:45:c4:da:61:82`,`08:45:50:ff:ca:3c`,`05:45:e4:58:1d:5f`,`07:45:a3:fd:a6:18`],
	[`0c:46:1b:75:ad:51`,`0d:46:08:b8:45:e9`,`09:46:cc:3d:5b:39`,`01:46:b4:c7:5a:d5`],
	[`05:47:8b:90:32:23`,`03:47:7b:ef:32:7f`,`04:47:85:f7:64:fe`,`0c:47:b9:79:03:22`],
	[`0b:48:82:cc:d1:61`,`02:48:d4:b1:0e:d0`,`0e:48:eb:54:58:55`,`09:48:22:ac:cd:16`],
	[`0b:49:38:17:a3:fe`,`04:49:3f:2c:5b:66`,`04:49:3b:c9:94:ce`,`0c:49:8d:41:7a:3f`],
	[`0a:50:be:33:d2:29`,`05:50:62:91:2c:ac`,`01:50:9a:c4:4e:c3`,`0b:50:ae:f3:3d:22`],
	[`0b:51:cf:0d:db:5c`,`0c:51:23:e2:1c:15`,`05:51:6b:e7:84:e3`,`0c:51:d3:40:dd:b5`],
	[`06:52:30:1a:2c:52`,`06:52:c1:cc:a2:5a`,`03:52:16:a1:6c:a2`,`0b:52:27:31:a2:c5`],
	[`05:53:a0:64:15:a4`,`0b:53:7d:2e:cd:19`,`0c:53:95:94:3a:9c`,`0d:53:ab:c6:41:5a`],
	[`05:54:3c:7f:57:9d`,`02:54:53:b9:a9:bb`,`00:54:55:57:e9:51`,`00:54:62:97:f5:79`],
	[`08:55:be:7d:bd:ab`,`0b:55:b8:45:2a:1c`,`08:55:98:2d:c2:25`,`08:55:3b:e7:db:da`],
	[`0e:56:58:bc:94:ac`,`08:56:26:bd:ae:98`,`07:56:de:e1:86:ed`,`0a:56:b6:cb:c9:4a`],
	[`0d:57:a7:57:ae:49`,`0d:57:78:17:b7:b8`,`0e:57:ad:ad:17:a0`,`05:57:f0:b5:7a:e4`],
	[`0c:58:0f:7e:0e:10`,`0c:58:cf:5f:89:52`,`03:58:cc:38:a4:31`,`06:58:86:d7:e0:e1`],
	[`06:59:f6:e1:7a:a6`,`0d:59:5e:9f:53:06`,`09:59:c6:7b:7b:79`,`09:59:3a:4e:17:aa`],
	[`0d:60:d9:e8:66:4b`,`0d:60:42:87:6e:b0`,`0f:60:0d:8b:21:81`,`03:60:01:ee:86:64`],
	[`0d:61:d3:28:e3:40`,`08:61:81:29:a4:87`,`05:61:9d:60:63:69`,`0b:61:f7:62:8e:34`],
	[`00:62:c6:2a:4f:12`,`08:62:2f:05:4e:23`,`0a:62:80:67:86:62`,`06:62:a2:12:a4:f1`],
	[`08:63:3d:51:bf:7c`,`02:63:3c:75:cf:03`,`0a:63:c8:df:d2:dd`,`0e:63:3e:85:1b:f7`],
	[`09:64:6c:8c:2b:38`,`0c:64:a3:a9:34:5e`,`08:64:f9:44:d5:4e`,`07:64:0f:e8:c2:b3`],
	[`0c:65:97:97:0c:86`,`0b:65:f9:ff:e2:b9`,`0f:65:ec:4e:bb:46`,`07:65:68:09:70:c8`],
	[`09:66:01:f0:ff:f5`,`0f:66:6d:a2:f2:94`,`01:66:99:8e:c7:87`,`08:66:bf:bf:0f:ff`],
	[`06:67:38:d6:74:40`,`01:67:0b:a0:9c:28`,`02:67:46:30:43:38`,`08:67:ce:2d:67:44`],
	[`0f:68:31:a8:cc:b0`,`0c:68:5f:43:9a:39`,`0f:68:ef:4b:a2:47`,`05:68:e4:8a:8c:cb`],
	[`03:69:1b:85:05:86`,`0d:69:8d:bf:d0:ab`,`0a:69:73:04:b4:03`,`0d:69:1e:38:50:58`]
],
[
	[`01:00:45:74:23:33`,`fd:00:af:57:c7:05`,`56:00:f5:73:eb:d5`,`1f:00:64:c7:42:56`],
	[`4b:01:30:45:34:43`,`df:01:74:72:ae:48`,`df:01:da:11:c6:f8`,`bd:01:89:c4:53:df`],
	[`0e:02:01:77:26:6c`,`e6:02:59:46:0e:00`,`b3:02:32:b5:ce:60`,`ee:02:1e:37:72:b3`],
	[`37:03:26:d8:48:8f`,`3a:03:cd:fe:52:31`,`14:03:e7:5e:82:a1`,`73:03:27:6d:84:14`],
	[`1f:04:6a:ed:77:79`,`5d:04:6b:e1:e7:1d`,`cd:04:94:b4:5e:dd`,`f5:04:dc:be:d7:cd`],
	[`32:05:7e:b9:5b:bc`,`e9:05:e1:e8:39:38`,`87:05:af:72:0c:98`,`2e:05:7b:7b:95:87`],
	[`c2:06:f3:75:f0:05`,`58:06:9f:06:2f:c3`,`29:06:ec:f0:08:83`,`25:06:03:97:5f:29`],
	[`3e:07:44:fa:2c:cf`,`5b:07:fd:d3:94:3d`,`21:07:61:84:f9:bd`,`e5:07:e5:8f:a2:21`],
	[`43:08:e9:2e:f6:61`,`08:08:4f:21:34:44`,`17:08:9e:9e:91:84`,`30:08:91:42:ef:17`],
	[`2b:09:33:e4:33:32`,`34:09:68:a8:fd:20`,`16:09:0d:7c:62:40`,`b3:09:3f:ee:43:16`],
	[`1d:10:7a:96:43:34`,`32:10:d9:88:45:13`,`70:10:1e:87:66:23`,`d3:10:e8:29:64:70`],
	[`89:11:b1:14:58:83`,`a3:11:e4:84:27:8d`,`f2:11:c7:fa:ea:3d`,`9a:11:24:f1:45:f2`],
	[`8c:12:88:23:62:23`,`2c:12:c3:57:10:8b`,`91:12:4b:4b:ce:cb`,`c2:12:82:62:36:91`],
	[`19:13:1a:2c:df:fa`,`f3:13:97:92:36:1c`,`02:13:66:64:64:3c`,`9f:13:66:92:cd:02`],
	[`0c:14:d3:8f:2d:d7`,`c4:14:d4:19:fd:09`,`c6:14:62:8c:c0:49`,`cc:14:1d:08:f2:c6`],
	[`e1:15:59:77:be:e5`,`6b:15:1a:41:a7:e8`,`25:15:6c:1e:b7:b8`,`16:15:c1:97:7b:25`],
	[`e7:16:2a:e0:cd:d3`,`68:16:53:c5:43:ec`,`1b:16:7b:d5:fc:8c`,`76:16:d8:fe:0c:1b`],
	[`81:17:2a:79:62:25`,`2a:17:3b:b8:1e:8a`,`c4:17:f6:cb:64:aa`,`12:17:b2:d7:96:c4`],
	[`9b:18:13:d1:35:5e`,`aa:18:af:c8:f9:9a`,`c2:18:cc:06:83:aa`,`ba:18:d7:9d:13:c2`],
	[`23:19:83:58:b7:79`,`5b:19:23:a3:74:2c`,`86:19:e0:c0:2d:bc`,`35:19:58:c5:8b:86`],
	[`28:20:fc:a9:c0:02`,`1a:20:50:08:6c:20`,`62:20:96:bb:0d:a0`,`81:20:82:ca:9c:62`],
	[`ab:21:87:2d:a0:02`,`6d:21:cd:68:81:ab`,`c7:21:52:b5:db:db`,`b6:21:b9:92:da:c7`],
	[`28:22:db:66:df:f3`,`2e:22:67:1a:88:24`,`7f:22:b8:f1:d7:e4`,`82:22:98:b6:6d:7f`],
	[`88:23:58:12:82:2d`,`07:23:17:0a:6f:8a`,`63:23:6f:1a:d6:7a`,`80:23:8f:e1:28:63`],
	[`c8:24:11:30:2d:da`,`37:24:6a:4e:35:c1`,`c2:24:ac:fe:04:71`,`83:24:81:c3:02:c2`],
	[`07:25:95:06:24:4a`,`0b:25:50:18:65:0e`,`c6:25:a1:36:eb:be`,`70:25:ad:20:62:c6`],
	[`3e:26:b1:b6:73:39`,`92:26:42:03:95:38`,`26:26:4e:a0:ea:28`,`e9:26:6c:3b:67:26`],
	[`56:27:1c:ef:c6:68`,`7d:27:28:0d:62:5c`,`f7:27:8b:5a:c5:dc`,`67:27:6b:ce:fc:f7`],
	[`41:28:bb:ab:23:36`,`8c:28:c3:69:c0:46`,`e8:28:b4:44:d5:c6`,`18:28:27:5a:b2:e8`],
	[`bb:29:32:98:1b:b2`,`9a:29:e4:65:5b:b5`,`ce:29:b0:a5:ac:a5`,`b9:29:2e:c9:81:ce`],
	[`d5:30:16:39:99:90`,`1d:30:b2:1e:8c:d2`,`09:30:30:b3:6f:d2`,`51:30:63:c3:99:09`],
	[`58:31:64:12:82:21`,`a5:31:f7:6a:51:52`,`b7:31:3b:41:fc:52`,`8a:31:75:61:28:b7`],
	[`90:32:34:72:d9:92`,`e1:32:37:cb:cb:9c`,`fa:32:cc:4b:a6:1c`,`0e:32:ab:77:2d:fa`],
	[`9c:33:bc:3d:9c:c6`,`6e:33:d7:3e:f7:92`,`ac:33:d2:78:f3:e2`,`c6:33:bd:93:d9:ac`],
	[`53:34:8d:d7:c1:18`,`27:34:98:b2:1b:54`,`66:34:f9:2b:a1:74`,`32:34:32:dd:7c:66`],
	[`6e:35:70:39:06:66`,`b3:35:8b:39:90:69`,`8c:35:b4:03:32:39`,`eb:35:a1:73:90:8c`],
	[`ed:36:f1:39:1a:ab`,`ba:36:0b:35:03:e3`,`21:36:b7:6e:97:a3`,`db:36:15:83:91:21`],
	[`54:37:ce:e6:aa:ad`,`7c:37:ce:b2:be:5a`,`11:37:32:db:51:ca`,`47:37:1b:fe:6a:11`],
	[`20:38:7c:81:af:f8`,`62:38:4d:8f:51:20`,`41:38:ce:8e:60:20`,`06:38:c7:08:1a:41`],
	[`53:39:ee:36:31:1d`,`a2:39:07:11:04:5c`,`01:39:ba:f3:ab:2c`,`3a:39:c8:23:63:01`],
	[`8e:40:97:29:7b:b5`,`eb:40:6c:29:0c:85`,`61:40:1c:31:26:b5`,`ee:40:1e:a2:97:61`],
	[`2d:41:74:84:80:09`,`14:41:97:60:c9:25`,`95:41:37:7a:e4:45`,`d1:41:19:68:48:95`],
	[`a6:42:70:ce:d2:23`,`72:42:49:0c:fa:ac`,`8d:42:5b:9c:4f:2c`,`67:42:e8:cc:ed:8d`],
	[`5a:43:20:81:c7:7c`,`89:43:7e:1a:b3:56`,`07:43:b5:1c:be:96`,`a8:43:c2:78:1c:07`],
	[`8d:44:5b:ef:9c:cb`,`15:44:ec:b9:71:88`,`67:44:64:f9:6e:58`,`d1:44:c3:fe:f9:67`],
	[`25:45:c4:da:61:18`,`e0:45:50:ff:ca:23`,`88:45:e4:58:1d:03`,`5e:45:a3:fd:a6:88`],
	[`1c:46:1b:75:ad:d5`,`77:46:08:b8:45:14`,`28:46:cc:3d:5b:74`,`c7:46:b4:c7:5a:28`],
	[`33:47:8b:90:32:22`,`7c:47:7b:ef:32:37`,`4f:47:85:f7:64:c7`,`37:47:b9:79:03:4f`],
	[`15:48:82:cc:d1:16`,`8f:48:d4:b1:0e:19`,`6e:48:eb:54:58:f9`,`58:48:22:ac:cd:6e`],
	[`eb:49:38:17:a3:3f`,`59:49:3f:2c:5b:ef`,`56:49:3b:c9:94:9f`,`b5:49:8d:41:7a:56`],
	[`9a:50:be:33:d2:22`,`be:50:62:91:2c:98`,`5d:50:9a:c4:4e:e8`,`ab:50:ae:f3:3d:5d`],
	[`c4:51:cf:0d:db:b5`,`64:51:23:e2:1c:c2`,`cc:51:6b:e7:84:42`,`46:51:d3:40:dd:cc`],
	[`23:52:30:1a:2c:c5`,`1b:52:c1:cc:a2:27`,`ea:52:16:a1:6c:b7`,`31:52:27:31:a2:ea`],
	[`4d:53:a0:64:15:5a`,`1d:53:7d:2e:cd:48`,`d3:53:95:94:3a:d8`,`d1:53:ab:c6:41:d3`],
	[`d9:54:3c:7f:57:79`,`70:54:53:b9:a9:db`,`1a:54:55:57:e9:0b`,`97:54:62:97:f5:1a`],
	[`b7:55:be:7d:bd:da`,`9f:55:b8:45:2a:ba`,`85:55:98:2d:c2:fa`,`79:55:3b:e7:db:85`],
	[`c2:56:58:bc:94:4a`,`f8:56:26:bd:ae:c5`,`a5:56:de:e1:86:85`,`2f:56:b6:cb:c9:a5`],
	[`9d:57:a7:57:ae:e4`,`ea:57:78:17:b7:93`,`02:57:ad:ad:17:a3`,`de:57:f0:b5:7a:02`],
	[`04:58:0f:7e:0e:e1`,`4c:58:cf:5f:89:06`,`7e:58:cc:38:a4:c6`,`44:58:86:d7:e0:7e`],
	[`6a:59:f6:e1:7a:aa`,`ae:59:5e:9f:53:65`,`46:59:c6:7b:7b:e5`,`aa:59:3a:4e:17:46`],
	[`bd:60:d9:e8:66:64`,`5e:60:42:87:6e:b1`,`11:60:0d:8b:21:e1`,`d5:60:01:ee:86:11`],
	[`0a:61:d3:28:e3:34`,`38:61:81:29:a4:0e`,`54:61:9d:60:63:8e`,`a3:61:f7:62:8e:54`],
	[`2c:62:c6:2a:4f:f1`,`64:62:2f:05:4e:25`,`81:62:80:67:86:45`,`c6:62:a2:12:a4:81`],
	[`cd:63:3d:51:bf:f7`,`26:63:3c:75:cf:c8`,`2a:63:c8:df:d2:68`,`d2:63:3e:85:1b:2a`],
	[`8c:64:6c:8c:2b:b3`,`aa:64:a3:a9:34:86`,`9a:64:f9:44:d5:a6`,`ca:64:0f:e8:c2:9a`],
	[`68:65:97:97:0c:c8`,`27:65:f9:ff:e2:6e`,`fa:65:ec:4e:bb:7e`,`82:65:68:09:70:fa`],
	[`5d:66:01:f0:ff:ff`,`9b:66:6d:a2:f2:58`,`af:66:99:8e:c7:b8`,`d9:66:bf:bf:0f:af`],
	[`05:67:38:d6:74:44`,`65:67:0b:a0:9c:0d`,`a9:67:46:30:43:5d`,`56:67:ce:2d:67:a9`],
	[`06:68:31:a8:cc:cb`,`d5:68:5f:43:9a:0a`,`04:68:ef:4b:a2:5a`,`6d:68:e4:8a:8c:04`],
	[`68:69:1b:85:05:58`,`9f:69:8d:bf:d0:6c`,`4a:69:73:04:b4:fc`,`89:69:1e:38:50:4a`]
]
];

var vpn_remote_tunnel_mac_test = function (vpn_cfg, conn_id) {
	
	const peer_nic_id = (1 - vpn_cfg.ace_nic_config[0].nic_name);
	return vpn_conn_mac_base(peer_nic_id, conn_id, vpn_cfg.conns[conn_id].tunnel_port);
};

var vpn_inbound_next_hops_test = function (vpn_cfg, conn_id) {
	
	const nic_id = vpn_cfg.ace_nic_config[0].nic_name;
	const next_hop_ips_arr = vpn_cfg.conns[conn_id].inbound_routes.split(/\s+/);
	var next_hops = [];
	for(var next_hop_idx = 0; next_hop_idx < next_hop_ips_arr.length; ++next_hop_idx) {
		next_hops.push({ ip: next_hop_ips_arr[next_hop_idx], mac: test_inbound_next_hop_macs[nic_id][conn_id][next_hop_idx] });
	};
	return next_hops;
};

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

var enet_vpn_get_backend_params_test = function (vpn_cfg) {

	const nic_id = vpn_cfg.ace_nic_config[0].nic_name;
	return test_backend_params[nic_id];
};

var enet_vpn_outbound_tunnel_connect_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {

	if(vpn_cfg.conns.length > conn_id) {
		var tunnel_spec = vpn_cfg.conns[conn_id];
		tunnel_spec[`remote_tunnel_mac`] = vpn_remote_tunnel_mac_test(vpn_cfg, conn_id);
		const ipsec_cfg = {
			spi: test_spis[conn_id],
			auth_algo: null,
			cipher_algo: `aes_gcm128-null`,
			auth_key: `00`,
			cipher_key: test_cipher_keys[conn_id]
		};
		enet_vpn_outbound_tunnel_connect(backend_ip, backend_port, tunnel_spec, ipsec_cfg);
	};
};

var enet_vpn_inbound_tunnel_connect_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {
	
	if(vpn_cfg.conns.length > conn_id) {
		var tunnel_spec = vpn_cfg.conns[conn_id];
		tunnel_spec[`remote_tunnel_mac`] = vpn_remote_tunnel_mac_test(vpn_cfg, conn_id);
		const ipsec_cfg = {
			spi: test_spis[conn_id],
			auth_algo: null,
			cipher_algo: `aes_gcm128-null`,
			auth_key: `00`,
			cipher_key: test_cipher_keys[conn_id]
		};
		enet_vpn_inbound_tunnel_connect(backend_ip, backend_port, tunnel_spec, ipsec_cfg);
	};
};

var enet_vpn_outbound_tunnel_disconnect_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {

	if(vpn_cfg.conns.length > conn_id) {
		var tunnel_spec = vpn_cfg.conns[conn_id];
		enet_vpn_outbound_tunnel_disconnect(backend_ip, backend_port, tunnel_spec);
	};
};

var enet_vpn_inbound_tunnel_disconnect_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {
	
	if(vpn_cfg.conns.length > conn_id) {
		var tunnel_spec = vpn_cfg.conns[conn_id];
		enet_vpn_inbound_tunnel_disconnect(backend_ip, backend_port, tunnel_spec);
	};
};

var enet_vpn_inbound_fwd_add_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {
	
	if(vpn_cfg.conns.length > conn_id) {
		var tunnel_spec = vpn_cfg.conns[conn_id];
		const next_hops = vpn_inbound_next_hops_test(vpn_cfg, conn_id);
		enet_vpn_inbound_fwd_add(backend_ip, backend_port, tunnel_spec, next_hops, vpn_cfg.conns[conn_id].lan_port);
	};
};

var enet_vpn_connect_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {

	enet_vpn_outbound_tunnel_connect_test(backend_ip, backend_port, vpn_cfg, conn_id);
	enet_vpn_inbound_tunnel_connect_test(backend_ip, backend_port, vpn_cfg, conn_id, function () {
		
		enet_vpn_inbound_fwd_add_test(backend_ip, backend_port, vpn_cfg, conn_id);
	});
};

var enet_vpn_disconnect_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {

	enet_vpn_outbound_tunnel_disconnect_test(backend_ip, backend_port, vpn_cfg, conn_id);
	enet_vpn_inbound_tunnel_disconnect_test(backend_ip, backend_port, vpn_cfg, conn_id);
};

var enet_vpn_listen_on_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {

	enet_vpn_outbound_tunnel_connect_test(backend_ip, backend_port, vpn_cfg, conn_id);
	enet_vpn_inbound_tunnel_connect_test(backend_ip, backend_port, vpn_cfg, conn_id, function () {
		
		enet_vpn_inbound_fwd_add_test(backend_ip, backend_port, vpn_cfg, conn_id);
	});
};

var enet_vpn_listen_off_test = function (backend_ip, backend_port, vpn_cfg, conn_id) {

	enet_vpn_outbound_tunnel_disconnect_test(backend_ip, backend_port, vpn_cfg, conn_id);
	enet_vpn_inbound_tunnel_disconnect_test(backend_ip, backend_port, vpn_cfg, conn_id);
};

var enet_vpn_load_cfg_test = function (backend_ip, backend_port, vpn_cfg) {

	enet_vpn_load_cfg(backend_ip, backend_port, { VPN: vpn_cfg }, function () {
		
		if(vpn_cfg.conns != undefined) {
			for(var conn_id = 0; conn_id < vpn_cfg.conns.length; ++conn_id) {
				if((vpn_cfg.conns[conn_id].listen == true) || (vpn_cfg.conns[conn_id].connect == true)) {
					enet_vpn_connect_test(backend_ip, backend_port, vpn_cfg, conn_id);
				};
			};
		};
	});
};
