# tieba.js

这是一个基于JavaScript实现的百度贴吧API调用库，支持在Node.js环境下使用。

## 特性
- **接口丰富**：提供了丰富的API接口，满足不同需求。
- **类型齐全**：确保在TypeScript项目中也能无缝使用。
- **测试覆盖范围广**：经过广泛的测试，确保代码的可靠性。



## 使用示例
以下是一个简单的使用示例：
```javascript
import {getPanel, Config, consume} from "tieba.js";

Config.init({
    bduss: 'XXXXXXXXX',
    needPlainText: true,
    needTimestamp: false
});

const data = await consume(getPanel('Admire_02'));
console.dir(data)
```

## Effect.js

本项目使用了Effect.js。Effect.js是一个功能强大的TypeScript框架，它提供了一个功能齐全的效果系统和丰富的标准库。它提供了用于处理异步、事件驱动数据处理的强大抽象和用于定义具有可组合计划的重试和重复策略的模块（当然它还不止于此）。
现在的getXXX函数都会返回一个Effect，为了消费这个Effect，需要用到提供的`consume`，`consumeAll`（消费Effect数组，），`consumeAllSuccess`（消费Effect数组，并只返回成功的结果）。



## 贡献指南
欢迎您的贡献！

请注意在package.json中有`insert-info`和`pbjs-codegen`两个脚本，若往项目中引入了新的proto文件，请先执行`insert-info`来插入 _package信息_ 以保证生成静态代码的统一性。再执行`pbjs-codegen`生成由 _protobufjs_ 的 _pbjs_ 和 _pbts_ CLI 生成的静态代码。

最后执行（或编写新的）测试用例。

---
测试用例应在Node.js版本大于22的情况下运行，否则会报错。
