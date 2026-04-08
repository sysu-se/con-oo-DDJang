# Homework 1.1 设计文档

## 一、领域对象如何被消费

### 1. View 层直接消费的是什么？

View 层直接消费的是 `gameDomain` store（来自 `src/node_modules/@sudoku/stores/gameDomain.js`）。

```
View 层
   │
   ├── $gameDomain.canUndo  →  控制 Undo 按钮状态
   ├── $gameDomain.canRedo  →  控制 Redo 按钮状态
   └── $userGrid            →  渲染棋盘数据
```

**不是直接消费 `Sudoku` 或 `Game` 对象**——它们被封装在 store 内部。

---

### 2. View 层拿到的数据是什么？

| 数据 | 类型 | 用途 |
|------|------|------|
| `$gameDomain.canUndo` | boolean | Undo 按钮是否可用 |
| `$gameDomain.canRedo` | boolean | Redo 按钮是否可用 |
| `$userGrid` | number[][] | 棋盘数据，用于渲染 |

---

### 3. 用户操作如何进入领域对象？

```
用户点击数字按钮
       │
       ▼
Keyboard.svelte
  handleKeyButton(num)
       │
       ├── userGrid.set($cursor, num)  →  更新 UI 显示
       │
       └── gameDomain.guess($cursor, num)  →  调用领域对象
                │
                ▼
           Game.guess({ row: y, col: x, value })
                │
                ├── 保存快照到 history
                └── 修改 Sudoku 棋盘数据
                         │
                         ▼
                   updateState()
                         │
                         ├── 更新 canUndo/canRedo
                         └── 同步到 userGrid store
                                  │
                                  ▼
                            Svelte 检测到 store 变化
                                  │
                                  ▼
                            触发 UI 重新渲染
```

---

### 4. 领域对象变化后，Svelte 为什么会更新？

**核心机制：Svelte Store 的响应式订阅**

```javascript
// gameDomain.js
const state = writable({
  game: null,
  canUndo: false,
  canRedo: false
});

// 当调用 updateState() 时：
function updateState() {
  if (gameInstance) {
    state.set({              // ← 使用 .set() 创建新对象
      game: gameInstance,
      canUndo: gameInstance.canUndo(),
      canRedo: gameInstance.canRedo()
    });
    syncToUserGrid();         // ← userGrid.set() 也会触发更新
  }
}
```

**为什么 `.set()` 会触发更新？**

Svelte 的 `writable` store 内部维护了一个订阅者列表。当调用 `.set()` 时：
1. Svelte 比较新旧值（使用 `!==`）
2. 检测到值变化后通知所有订阅者
3. 组件中 `$store` 绑定的数据随之更新
4. Svelte 自动重新渲染使用了这些数据的组件

---

## 二、响应式机制说明

### 1. 我们依赖的是什么机制？

我们依赖的是 **Svelte writable store** 的响应式机制：

```javascript
// gameDomain.js
import { writable } from 'svelte/store';

function createGameStore() {
  const state = writable({
    canUndo: false,
    canRedo: false
  });

  return {
    subscribe: state.subscribe,
    // ...
  };
}
```

### 2. 哪些数据是响应式暴露给 UI 的？

| Store | 响应式数据 | 用途 |
|-------|-----------|------|
| `gameDomain` | `canUndo`, `canRedo` | UI 按钮状态 |
| `userGrid` | 整个 9x9 数组 | 棋盘渲染 |

### 3. 哪些状态留在领域对象内部？

| 内部状态 | 原因 |
|---------|------|
| `Game.history` | UI 不需要知道历史细节，只需要能调用 undo/redo |
| `Game.redoHistory` | 同上 |
| `Sudoku.grid` | 通过 `userGrid` store 间接暴露给 UI |

### 4. 如果不用 store，直接 mutate 内部对象，会出现什么问题？

**问题示例：**

```javascript
// 错误做法：直接修改内部数组
currentSudoku.getGrid()[row][col] = value;
```

**为什么 Svelte 不会自动更新？**

1. Svelte 的响应式系统基于 **赋值操作**（`=`）触发，而不是基于 **属性修改**（`.prop = value`）

2. 当你执行 `array[row][col] = value` 时：
   - 数组引用没变
   - Svelte 没有检测到新的赋值操作
   - `$userGrid` 不会触发重新渲染

3. 这就是为什么 `userGrid.set()` 内部使用了 `.update()` 返回一个新数组：
   ```javascript
   userGrid.update($userGrid => {
     $userGrid[pos.y][pos.x] = value;  // 修改
     return $userGrid;                // 返回同一个引用
   });
   ```

**解决方案：使用不可变更新模式或使用 store 的 `.set()`/`.update()` 方法**

---

## 三、改进说明

### 1. 相比 Homework 1，改进了什么？

| HW1 问题 | 改进方案 |
|---------|---------|
| 领域对象只存在于测试中 | 创建 `gameDomain` store 真正接入 Svelte |
| UI 直接操作旧 store | UI 通过 `gameDomain.guess()` 调用领域对象 |
| Undo/Redo 按钮逻辑不连领域对象 | 按钮直接调用 `gameDomain.undo()/redo()` |

### 2. 为什么 HW1 中的做法不足以支撑真实接入？

HW1 只实现了领域对象的**独立可测试性**，但没有实现**与 Svelte 的集成**：

- `Sudoku` / `Game` 是普通 JS 对象
- Svelte 组件不知道它们的存在
- UI 仍然使用旧的 `grid` store 直接操作数组

### 3. 新设计的 trade-off

| 优点 | 缺点 |
|------|------|
| 领域逻辑与 UI 分离，易于测试 | 多了一层 store，需要维护 |
| Undo/Redo 逻辑集中在领域层 | 同步 userGrid 有一定性能开销（但可接受） |
| 扩展性好，可以轻松替换底层实现 | - |

---

## 四、技术架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        View 层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Board.svelte │  │Actions.svelte│  │Keyboard.svelte│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Store 适配层                              │
│         src/node_modules/@sudoku/stores/                   │
│                      gameDomain.js                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  gameDomain Store                                    │   │
│  │  ├── canUndo, canRedo (响应式)                      │   │
│  │  ├── startNew(), startCustom()                     │   │
│  │  ├── guess(), undo(), redo()                       │   │
│  │  └── toJSON(), loadFromJSON()                      │   │
│  │                                                      │   │
│  │  userGrid Store                                     │   │
│  │  └── 9x9 数组 (响应式，用于 UI 渲染)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      领域层                                 │
│                   src/domain/index.js                        │
│  ┌─────────────────┐        ┌─────────────────┐              │
│  │    Sudoku       │        │     Game        │              │
│  │  ├── getGrid()  │◄───────│  ├── guess()   │              │
│  │  ├── guess()    │        │  ├── undo()     │              │
│  │  ├── clone()    │        │  ├── redo()     │              │
│  │  └── toJSON()   │        │  └── toJSON()   │              │
│  └─────────────────┘        └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、关键设计决策

### 1. 为什么使用 Store Adapter 模式？

作业推荐方案 A（Store Adapter），原因：
- 不需要修改 `Sudoku` / `Game` 领域对象
- 领域对象保持纯净（无 Svelte 依赖）
- 可以独立测试领域逻辑
- UI 层只需调用 store 方法，无需关心实现细节

### 2. 为什么 `guess` 后要同步 userGrid？

因为 `userGrid` 是 Svelte 响应式系统的数据源。当 `Game.guess()` 修改了内部 `Sudoku` 的 `grid` 数组后：

1. `Game` 的状态变了
2. 但 Svelte 的响应式依赖是 `userGrid` store
3. 所以必须显式同步到 `userGrid`，Svelte 才能检测到变化

### 3. 为什么不直接让 `Sudoku` 继承 Svelte store？

因为违反了**单一职责原则**和**依赖方向**：

- 领域对象应该专注于业务逻辑
- Svelte 是 UI 框架的响应式机制
- 领域对象不应该依赖 UI 框架

---

## 六、文件清单

| 文件路径 | 职责 |
|---------|------|
| `src/domain/index.js` | 核心领域对象（Sudoku, Game） |
| `src/node_modules/@sudoku/stores/gameDomain.js` | Store 适配层 |
| `src/node_modules/@sudoku/game.js` | 游戏入口（startNew, startCustom） |
| `src/components/Controls/ActionBar/Actions.svelte` | Undo/Redo 按钮 |
| `src/components/Controls/Keyboard.svelte` | 数字键盘输入 |
| `src/components/Board/index.svelte` | 棋盘渲染 |
