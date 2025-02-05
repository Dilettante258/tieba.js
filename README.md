# tieba.js

这是一个基于JavaScript实现的百度贴吧API调用库，支持在Node.js环境下使用。

## 特性
- **接口丰富**：提供了丰富的API接口，满足不同需求。
- **类型齐全**：确保在TypeScript项目中也能无缝使用。
- **测试覆盖范围广**：经过广泛的测试，确保代码的可靠性。



## 使用示例
以下是一个简单的使用示例：
```javascript
import { getPanel } from "tieba.js";

const data = await getPanel('叫我老冰就好了');
console.dir(data)
```

## 贡献指南
欢迎您的贡献！

请注意在package.json中有`insert-info`和`pbjs-codegen`两个脚本，若往项目中引入了新的proto文件，请先执行`insert-info`来插入 _package信息_ 以保证生成静态代码的统一性。再执行`pbjs-codegen`生成由 _protobufjs_ 的 _pbjs_ 和 _pbts_ CLI 生成的静态代码。

最后执行（或编写新的）测试用例。

