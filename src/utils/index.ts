//========================================================================
//
//  Implementation
//
//========================================================================

/**
 * パス先頭のスラッシュを除去します。
 * @param path
 */
function removeStartSlash(path: string | undefined | null): string {
  if (!path) return ''
  return path.replace(/^\/*/, '')
}

/**
 * パス末尾のスラッシュを除去します。
 * @param path
 */
function removeEndSlash(path: string | undefined | null): string {
  if (!path) return ''
  return path.replace(/\/*$/, '')
}

/**
 * パスの両端のスラッシュを除去します。
 * @param path
 */
function removeBothEndsSlash(path: string | undefined | null): string {
  if (!path) return ''
  return removeStartSlash(removeEndSlash(path))
}

/**
 * パスの先頭にあるディレクトリを表す文字を削除します。
 * 例: './aaa'  → 'aaa'
 *     '../aaa' → 'aaa'
 *     '/aaa'   → 'aaa'
 * @param path
 */
function removeStartDirChars(path: string | undefined | null): string {
  if (!path) return ''
  return path.replace(/^\.*\/*/, '')
}

/**
 * ファイルパスをファイル名とディレクトリパスに分割します。
 * @param filePath
 */
function splitFilePath(filePath: string): { fileName: string; dirPath: string } {
  const segments = filePath.split('/')
  const fileName = segments[segments.length - 1]
  let dirPath = ''
  if (segments.length >= 2) {
    dirPath = segments.slice(0, segments.length - 1).join('/')
  }
  return { fileName, dirPath }
}

/**
 * 指定されたパスを階層的に分割します。
 *
 * 例: ['d1/d11/fileA.txt', `d1/d11/fileB.txt`]が指定された場合、
 *     ['d1', 'd1/d11', 'd1/d11/fileA.txt', 'd1/d11/fileB.txt']を返します。
 *
 * @param paths
 */
function splitHierarchicalPaths(...paths: (string | undefined | null)[]): string[] {
  const set: Set<string> = new Set<string>()

  for (const dirPath of paths) {
    if (!dirPath) continue
    const segments = dirPath.split('/').filter(item => !!item)
    for (let i = 0; i < segments.length; i++) {
      const currentDirPath = segments.slice(0, i + 1).join('/')
      set.add(currentDirPath)
    }
  }

  // ディレクトリ階層順にソート
  return Array.from(set).sort((a, b) => {
    return a < b ? -1 : a > b ? 1 : 0
  })
}

/**
 * パスリストの中でまとめられるファミリーパスをサマリーします。
 *
 * `paths`に次が指定された場合:
 *   + d1/d11
 *   + d1/d11/d111
 *   + d1/d11/d112
 *   + d2/d21
 *   + d2/d21/d211
 *
 * 結果として次のようにサマリーされます:
 *   + d1/d11/d111
 *   + d1/d11/d112
 *   + d2/d21/d211
 */
function summarizeFamilyPaths(paths: string[]): string[] {
  const pushMaxPathToArray = (array: string[], newPath: string) => {
    for (let i = 0; i < array.length; i++) {
      const path = array[i]
      if (path.startsWith(newPath)) {
        return
      } else if (newPath.startsWith(path)) {
        array[i] = newPath
        return
      }
    }
    array.push(newPath)
  }

  const result: string[] = []
  for (const path of paths) {
    pushMaxPathToArray(result, path)
  }
  return result
}

/**
 * オブジェクトから指定されたプロパテを取り出します。
 * @param obj 対象オブジェクト
 * @param props 取り出したいプロパティ
 * @param excludeValues 除外したいプロパティ値
 */
function pickProps<T, K extends keyof T>(obj: T, props: K[], excludeValues?: any[]): { [P in K]: T[P] } {
  const result: any = {}
  for (const prop of props) {
    // オブジェクトに指定されたキーが存在しない場合、そのキーを無視
    if (!(prop in obj)) continue
    // プロパティの値を取得
    const propValue = obj[prop]
    // プロパティの値が除外リストに一致する場合、無視
    const isExclude = (excludeValues ?? []).some(excludeValue => propValue === excludeValue)
    if (isExclude) continue
    // 戻り値に指定されたキーの値を設定
    result[prop] = obj[prop]
  }
  return result
}

/**
 * オブジェクト配列を指定されたキーの値でマップ化します。
 * @param list オブジェクト配列
 * @param key オブジェクトのキーを指定。この値がマップのキーに使用されます。
 */
function arrayToDict<T>(list: T[], key: keyof T): Record<string | number, T> {
  return list.reduce((result, item) => {
    const k = item[key]
    if (typeof k === 'string') {
      result[k] = item
    } else if (typeof k === 'number') {
      result[k] = item
    }
    return result
  }, {} as Record<string | number, any>)
}

/**
 * 配列を塊に分割します。
 * @param array 分割したい配列
 * @param size 塊のアイテム数
 */
function splitArrayChunk<T>(array: T[], size: number): T[][] {
  return array.reduce<T[][]>((result, value, index) => {
    if (index % size) {
      return result
    } else {
      return [...result, array.slice(index, index + size)]
    }
  }, [])
}

class DuplicateItem<T> {
  constructor(container: BaseDuplicateContainer<T>, value: T, index: number) {
    this.container = container
    this.value = value
    this.index = index
  }

  readonly container: BaseDuplicateContainer<T>
  value!: T
  index!: number
  first = false
  last = false
  removed = false

  remove(): void {
    this.container.remove(this)
  }
}

abstract class BaseDuplicateContainer<T> {
  constructor(array: T[]) {
    this.array = array
  }

  protected array: T[]

  duplicates: DuplicateItem<T>[] = []

  remove(target: DuplicateItem<T>): void {
    this.array.splice(target.index, 1)
    for (const item of this.duplicates) {
      if (target.index < item.index && !item.removed) {
        item.index = item.index - 1
      }
    }
    target.removed = true
  }
}

class DuplicateValueContainer<T> extends BaseDuplicateContainer<T> {
  constructor(protected array: T[]) {
    super(array)

    let duplicateValues = this.array.filter((item, index) => {
      return this.array.indexOf(item) != index
    })
    duplicateValues = Array.from(new Set(duplicateValues))

    for (const duplicateValue of duplicateValues) {
      const myDuplicates: DuplicateItem<T>[] = []
      let fromIndex = 0
      do {
        fromIndex = this.array.indexOf(duplicateValue, fromIndex)
        if (fromIndex >= 0) {
          const duplicateItem = new DuplicateItem(this, duplicateValue, fromIndex)
          myDuplicates.push(duplicateItem)
          this.duplicates.push(duplicateItem)
          fromIndex += 1
        }
      } while (fromIndex >= 0)

      myDuplicates[0].first = true
      myDuplicates[myDuplicates.length - 1].last = true
    }

    this.duplicates.sort((a, b) => {
      return a.index < b.index ? -1 : a.index > b.index ? 1 : 0
    })
  }
}

class DuplicateItemContainer<T, K extends keyof T> extends BaseDuplicateContainer<T> {
  constructor(protected array: T[], protected field: K) {
    super(array)

    const values = this.array.map(item => item[this.field])
    let duplicateValues = values.filter((item, index) => {
      return values.indexOf(item) != index
    })
    duplicateValues = Array.from(new Set(duplicateValues))

    for (const duplicateValue of duplicateValues) {
      const myDuplicates: DuplicateItem<T>[] = []
      let fromIndex = 0
      do {
        fromIndex = this.array.findIndex((item, index) => {
          if (index < fromIndex) return false
          return item[this.field] === duplicateValue
        })
        if (fromIndex >= 0) {
          const duplicateItem = new DuplicateItem(this, this.array[fromIndex], fromIndex)
          myDuplicates.push(duplicateItem)
          this.duplicates.push(duplicateItem)
          fromIndex += 1
        }
      } while (fromIndex >= 0)

      myDuplicates[0].first = true
      myDuplicates[myDuplicates.length - 1].last = true
    }

    this.duplicates.sort((a, b) => {
      return a.index < b.index ? -1 : a.index > b.index ? 1 : 0
    })
  }
}

/**
 * 配列の中から重複した値を取得します。
 *
 * @example
 * findDuplicateValues(['a', 'b', 'c', 'a', 'd', 'c'])
 * // [
 * //   { value: 'a', index: 0, first: true, last: false, removed: false },
 * //   { value: 'c', index: 2, first: true, last: false, removed: false },
 * //   { value: 'a', index: 3, first: false, last: true, removed: false },
 * //   { value: 'c', index: 5, first: false, last: true, removed: false },
 * //]
 *
 * @param array
 */
function findDuplicateValues<T>(array: T[]): DuplicateItem<T>[] {
  return new DuplicateValueContainer(array).duplicates
}

/**
 * 配列アイテムの指定フィールドが重複しているアイテムを取得します。
 *
 * @example
 * findDuplicateItems([
 *   { id: 0, str: 'a' },
 *   { id: 1, str: 'b' },
 *   { id: 2, str: 'c' },
 *   { id: 3, str: 'a' },
 *   { id: 4, str: 'd' },
 *   { id: 5, str: 'c' },
 * ], 'str')
 * // [
 * //   { value: { id: 0, str: 'a' }, index: 0, first: true, last: false, removed: false },
 * //   { value: { id: 2, str: 'c' }, index: 2, first: true, last: false, removed: false },
 * //   { value: { id: 3, str: 'a' }, index: 3, first: false, last: true, removed: false },
 * //   { value: { id: 5, str: 'c' }, index: 5, first: false, last: true, removed: false },
 * //]
 *
 * @param array
 * @param field
 */
function findDuplicateItems<T, K extends keyof T>(array: T[], field: K): DuplicateItem<T>[] {
  return new DuplicateItemContainer(array, field).duplicates
}

/**
 * 指定されたミリ秒の間スリープします。
 * @param ms
 */
async function sleep(ms?: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  }) as Promise<void>
}

/**
 * 指定された値が`null`または`undefined`でないことをチェックします。
 * `null`または`undefined`の場合`false`を、そうでない場合は`true`を返します。
 * @param value
 */
const nonNullable = <T>(value: T): value is NonNullable<T> => {
  return value !== null && value !== undefined
}

/**
 * 指定された値が空でないことをチェックします。
 * 以下の場合は「空」と判定し、`false`を返します。
 * - `null`または`undefined`の場合
 * - 空文字の場合
 * - 空オブジェクトの場合
 * @param value
 */
function notEmpty<T>(value: T): value is NonNullable<T> {
  if (!nonNullable(value)) return false
  if (typeof value === 'string') {
    return value !== ''
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value).length > 0
  }
  return true
}

/**
 * 配列をシャッフルします。
 * @param array
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = Object.assign([], array)
  for (let i = result.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]
    result[i] = result[r]
    result[r] = tmp
  }
  return result
}

//========================================================================
//
//  Exports
//
//========================================================================

export {
  arrayToDict,
  findDuplicateItems,
  findDuplicateValues,
  nonNullable,
  notEmpty,
  pickProps,
  removeBothEndsSlash,
  removeEndSlash,
  removeStartDirChars,
  removeStartSlash,
  shuffleArray,
  sleep,
  splitArrayChunk,
  splitFilePath,
  splitHierarchicalPaths,
  summarizeFamilyPaths,
}
