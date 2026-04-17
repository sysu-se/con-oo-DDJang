# con-oo-DDJang - Review

## Review 结论

当前实现已经把 `Game` / `Sudoku` 接到了部分真实 UI 入口上，尤其是新开一局、普通数字输入、撤销/重做，但整体仍然是“新领域对象 + 旧 store 流程并存”的半迁移状态。领域层没有成为唯一事实来源，`Sudoku` 也没有把题面/玩家状态、规则校验等核心业务概念真正收进自身模型，因此 OOD、业务建模和 Svelte 接入都存在比较实质的问题。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | poor |
| OOD | poor |

## 缺点

### 1. Svelte 层仍保留旧 `grid` 流程，领域对象没有成为唯一真实数据源

- 严重程度：core
- 位置：src/node_modules/@sudoku/game.js:14-34; src/components/Board/index.svelte:4-8,49-52; src/node_modules/@sudoku/stores/game.js:1-18; src/components/Controls/ActionBar/Actions.svelte:3,14-21; src/components/Modal/Types/Share.svelte:5,11
- 原因：`startNew/startCustom` 只初始化 `gameDomain`，但棋盘中“是否为用户输入”的样式、冲突高亮、提示、胜利判定和分享仍然依赖旧的 `@sudoku/stores/grid` / `@sudoku/stores/game`。从静态调用链看，关键流程会和当前 `Game` 状态脱节，这不符合“View 真正消费领域对象”的作业要求。

### 2. 领域模型没有建模“题面 givens”和“玩家填写”这两个不同概念

- 严重程度：core
- 位置：src/domain/sudoku.js:8-19; src/components/Board/index.svelte:49-52; src/components/Modal/Types/Share.svelte:11
- 原因：`Sudoku` 只持有单一 `grid`，`guess` 也可以直接覆盖任意格子。于是固定题面、用户输入样式、可分享题目这些业务语义只能回退到旧 `grid` store 去推断，说明核心业务概念没有落在领域层，模型本身也无法保护题面格子不被修改。

### 3. 输入流程仍直接 mutate adapter 暴露的 `userGrid`，破坏 `Game` 作为唯一操作入口

- 严重程度：core
- 位置：src/node_modules/@sudoku/stores/gameDomain.js:6-38; src/components/Controls/Keyboard.svelte:17-24
- 原因：`createGameStore` 把可写的 `userGrid` 直接导出给组件，`Keyboard` 又先 `userGrid.set/clear` 再调用 `gameDomain.guess`。这让 UI 可以绕过领域对象直接改状态，边界不清晰，也不符合“用户输入必须调用 `Game` / `Sudoku` 接口”的要求。

### 4. 数独规则校验没有进入实际领域行为

- 严重程度：major
- 位置：src/domain/validation.js:3-37; src/domain/structure.js:3-30; src/domain/game.js:6; src/domain/sudoku.js:16-18
- 原因：仓库里虽然存在 `validateGrid`、`isValidSudokuStructure` 等辅助函数，但实际 gameplay 路径只校验对象形状和坐标范围，没有把结构合法性、可编辑性、冲突信息等规则封装到 `Sudoku` / `Game` 的公开能力里。结果是“校验能力”并没有真正成为领域对象职责。

### 5. Svelte adapter 通过 81 次逐格写入同步视图，响应式设计偏粗糙

- 严重程度：minor
- 位置：src/node_modules/@sudoku/stores/gameDomain.js:49-68
- 原因：`updateState` 每次都先取 clone，再循环整盘调用 `userGrid.set`。这既保留了一份额外的可变镜像状态，也引入了不必要的多次 store 通知；更符合 Svelte 惯例的做法应是一次性发布完整快照或暴露只读派生状态。

## 优点

### 1. 撤销/重做职责已收敛到领域层

- 位置：src/domain/game.js:12-59; src/domain/history.js:7-64
- 原因：`Game` 统一管理当前 `Sudoku` 与 `HistoryManager`，组件没有自己维护 undo/redo 栈，这比把历史逻辑散落在 Svelte 事件处理函数中更符合 OOD。

### 2. 开始新局、自定义题目和撤销/重做已经至少部分走通到 `gameDomain` / `Game`

- 位置：src/node_modules/@sudoku/game.js:14-34; src/components/Modal/Types/Welcome.svelte:16-24; src/components/Header/Dropdown.svelte:20-23,51-53; src/components/Controls/ActionBar/Actions.svelte:27-33
- 原因：启动入口与 undo/redo 按钮不再直接操作旧二维数组，而是通过统一的 adapter/domain 方法进入领域层，说明真实 UI 流程并非完全脱离领域对象。

### 3. 读取与序列化时有意识地做快照隔离

- 位置：src/domain/sudoku.js:12-28; src/domain/serialization.js:20-42
- 原因：`getGrid`、`clone`、`toJSON` 都返回拷贝，`createGameFromJSON` 也会把历史快照重建成 `Sudoku` 对象，避免外部直接持有内部可变引用。

## 补充说明

- 本次结论只基于静态阅读，未运行测试，也未进行实际 Svelte 交互验证。
- 关于“胜利判定/提示/分享/冲突高亮与真实游戏状态脱节”的判断，来自对 `startNew/startCustom`、`gameDomain`、旧 `grid`/`game` store 以及相关组件静态调用链的审查，而非运行时观测。
- 审查范围已按要求限制在 `src/domain/*` 及其直接关联的 Svelte/store 接入代码，没有扩展到无关目录。
