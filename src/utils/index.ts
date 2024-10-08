// import {forumReqSerialize, forumResDeserialize} from "../ProtobufParser";
import {Buffer} from 'buffer';
import {createHash} from 'crypto';

export const baseUrl = 'https://tiebac.baidu.com'
export const timeFormat = Intl.DateTimeFormat('zh-CN', {
  timeStyle: "short",
  dateStyle: "short",
});

let defaultBDUSS = "";

if (process.env.BDUSS) {
  defaultBDUSS = process.env.BDUSS;
} else {
  throw new Error("BDUSS环境变量未设置!")
}


export async function postFormData(url: string, data: any) {
  const response = await fetch(baseUrl + url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data,
  }).catch(error => {
    console.error('Fetch failed:', error);
  });
  if (response) {
    return await response.json();
  }
  throw new Error('Fetch failed');
}

export async function postProtobuf(url: string, buffer: Buffer) {
  let blob = new Blob([buffer]);
  let data = new FormData();
  data.append('data', blob);
  const response = await fetch(baseUrl + url, {
    method: "POST",
    headers: {
      'x_bd_data_type': 'protobuf',
    },
    body: data,
  }).catch(error => {
    console.error('Fetch failed:', error);
  });
  if (response) {
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  }
  throw new Error('Fetch failed');
}


export function packRequest(data: any) {
  let params = new URLSearchParams(data);
  if (!params.has('BDUSS')) {
    params.append('BDUSS', defaultBDUSS);
  }
  if (!params.has('_client_version')) {
    params.append('_client_version', '12.57.4.2');
  }
  if (!params.has('pn')) {
    params.append('pn', params.get('page') || '1');
  }
  params.delete('page');
  params.sort();
  const string = Array.from(params.entries()).map(entry => entry.join('=')).join('');
  const md5 = createHash('md5');
  const sign = md5.update(string + 'tiebaclient!!!').digest('hex').toUpperCase();
  params.append('sign', sign);
  return Array.from(params.entries()).map(entry => entry.join('=')).join('&');
}

// export function countUserAttributes(userList) {
//   const counts = {
//     ipAddress: {},
//     levelId: {},
//     gender: {}
//   };

//   for (const obj of userList) {
//     const { ipAddress, levelId, gender } = obj;

//     // 统计 ipAddress 出现次数
//     if (ipAddress) {
//       if (counts.ipAddress[ipAddress]) {
//         counts.ipAddress[ipAddress]++;
//       } else {
//         counts.ipAddress[ipAddress] = 1;
//       }
//     }

//     // 统计 levelId 出现次数
//     if (levelId) {
//       if (counts.levelId[levelId]) {
//         counts.levelId[levelId]++;
//       } else {
//         counts.levelId[levelId] = 1;
//       }
//     }

//     // 统计 gender 出现次数
//     if (gender !== undefined) {
//       if (counts.gender[gender]) {
//         counts.gender[gender]++;
//       } else {
//         counts.gender[gender] = 1;
//       }
//     }
//   }

//   // 转换成所需的格式
//   const ipAddressResult = [];

//   // ipAddress按倒序排列
//   const sortIpList = Object.entries(counts.ipAddress).sort((a, b) => b[1] - a[1]);

//   for (const item of sortIpList) {
//     ipAddressResult.push({ name: item[0], value: item[1] });
//   }

//   counts.ipAddress = ipAddressResult;

//   return counts;
// }

// export async function handlePromises(promises, maxConcurrent = 100, delay = 1000) {
//   const results = [];
//   for (let i = 0; i < promises.length; i += maxConcurrent) {
//       const chunk = promises.slice(i, i + maxConcurrent);
//       results.push(...await Promise.all(chunk));
//       if (i + maxConcurrent < promises.length) {
//           await new Promise(resolve => setTimeout(resolve, delay));
//       }
//   }
//   return results;
// }

// export function mergeCounters(array) {
//   let result = {
//       emojicounter: {},
//       emoticonCounter: {},
//       userAttributesCount: {
//           ipAddress: [],
//           levelId: {},
//           gender: {}
//       },
//       timeLine: []
//   };

//   array.forEach(item => {
//       // Merge emojicounter
//       for (let emoji in item.emojicounter) {
//           if (result.emojicounter[emoji]) {
//               result.emojicounter[emoji] += item.emojicounter[emoji];
//           } else {
//               result.emojicounter[emoji] = item.emojicounter[emoji];
//           }
//       }

//       // Merge emoticonCounter
//       for (let emoticon in item.emoticonCounter) {
//           if (result.emoticonCounter[emoticon]) {
//               result.emoticonCounter[emoticon] += item.emoticonCounter[emoticon];
//           } else {
//               result.emoticonCounter[emoticon] = item.emoticonCounter[emoticon];
//           }
//       }

//       // Merge userAttributesCount.ipAddress
//       item.userAttributesCount.ipAddress.forEach(ip => {
//           let index = result.userAttributesCount.ipAddress.findIndex(i => i.name === ip.name);
//           if (index !== -1) {
//               result.userAttributesCount.ipAddress[index].value += ip.value;
//           } else {
//               result.userAttributesCount.ipAddress.push({ ...ip });
//           }
//       });

//       // Merge userAttributesCount.levelId
//       for (let level in item.userAttributesCount.levelId) {
//           if (result.userAttributesCount.levelId[level]) {
//               result.userAttributesCount.levelId[level] += item.userAttributesCount.levelId[level];
//           } else {
//               result.userAttributesCount.levelId[level] = item.userAttributesCount.levelId[level];
//           }
//       }

//       // Merge userAttributesCount.gender
//       for (let gender in item.userAttributesCount.gender) {
//           if (result.userAttributesCount.gender[gender]) {
//               result.userAttributesCount.gender[gender] += item.userAttributesCount.gender[gender];
//           } else {
//               result.userAttributesCount.gender[gender] = item.userAttributesCount.gender[gender];
//           }
//       }

//       // Merge timeLine
//       result.timeLine = result.timeLine.concat(item.timeLine).sort((a, b) => a - b);
//   });

//   return result;
// }
