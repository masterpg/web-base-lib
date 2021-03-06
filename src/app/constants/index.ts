//========================================================================
//
//  Constants
//
//========================================================================

const APIVersion = '0.0.1'

type LangCode = 'ja' | 'en'

const LangCodes = ['ja', 'en'] as const

namespace StorageUserConfig {
  export const RootName = 'users'
}

namespace StorageArticleConfig {
  export const RootName = 'articles'
  export const AssetsName = 'assets'
  export const MasterSrcFileName = 'master-src.md'
  export const DraftSrcFileName = 'draft-src.md'
}

namespace Entities {
  export namespace Users {
    export const Name = 'users'
  }
  export namespace StorageNodes {
    export const Name = 'storage-nodes'
  }
  export namespace ArticleTag {
    export const Name = 'article-tags'
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { APIVersion, Entities, LangCode, LangCodes, StorageArticleConfig, StorageUserConfig }
