## HW 问题收集

### 已解决

#### 1. Svelte 响应式机制是什么？为什么 store 能触发更新？

**上下文**：在集成领域对象到 Svelte 时，需要理解为什么 `state.set()` 能触发 UI 更新，而直接修改对象属性不行。

**解决手段**：
- 阅读 Svelte 官方文档关于 writable store 的说明
- 理解 Svelte 3 的响应式基于"赋值操作"而非"属性修改"
- 动手实验：用 `writable` 的 `.set()`/`.update()` 方法触发更新

**结论**：Svelte 的 `$store` 订阅机制会在 `.set()` 时通知所有订阅者，触发组件重新渲染。

---

#### 2. npm install 报错 ERESOLVE，依赖冲突如何解决？

**上下文**：运行 `npm install` 时报错：
```
npm error ERESOLVE could not resolve
npm error peerOptional postcss-load-config@"^2.1.0" from svelte-preprocess@4.6.1
```

**解决手段**：
- 添加 `.npmrc` 配置文件
- 设置 `legacy-peer-deps=true`
- 或者使用 `npm install --legacy-peer-deps`

**结论**：项目依赖存在版本冲突，通过设置 legacy-peer-deps 可以忽略 peer dependency 警告继续安装。

---

#### 3. 领域对象如何真正接入 Svelte UI？

**上下文**：作业要求"真正接入"而不仅仅是"测试可用"。HW1 的领域对象只在测试中有效，UI 仍然使用旧的 store。

**解决手段**：
- 创建 Store Adapter 模式：`gameDomain.js`
- 让 UI 组件（Keyboard.svelte、Actions.svelte）调用 `gameDomain.guess()/undo()/redo()`
- 使用 `$gameDomain.canUndo` 等响应式数据控制 UI 状态

**结论**：通过适配层将领域对象封装成 Svelte store，实现真正的集成。

---

### 未解决

#### 1. `sameArea` 高亮区域的作用是什么？

**上下文**：`src/components/Board/index.svelte`

```javascript
sameArea={$settings.highlightCells && !isSelected($cursor, x, y) && isSameArea($cursor, x, y)}
```

**尝试解决手段**：
- 查看 `isSameArea()` 函数定义
- 理解它判断"当前格子与选中格子是否在同一行/列/宫"
- 但仍不清楚这个高亮对玩家有什么实际帮助

**疑问**：这是数独辅助功能吗？还是 UI 美化？用户体验意图不明确。

---

#### 2. `invalidCells` 是如何计算的？为什么能检测冲突？

**上下文**：
```javascript
conflictingNumber={$settings.highlightConflicting && $grid[y][x] === 0 && $invalidCells.includes(x + ',' + y)}
```

**尝试解决手段**：查看 `invalidCells` 的定义来源，但未追踪到具体计算逻辑。

**疑问**：
- 它是基于行/列/宫冲突计算的？
- 还是基于数独规则的合法解？
- 如果是基于"当前局面是否有解"，计算成本会不会很高？