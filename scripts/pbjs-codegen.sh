#!/bin/bash
set -eo pipefail  # 启用严格错误检查

# 配置颜色代码用于输出提示
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 恢复默认颜色

# 初始化路径变量
PROTO_ROOT="$(pwd)/src/proto"
OUTPUT_DIR="$(pwd)/src/pb-gen"
COLLECTION_REQ="DataReqCollection.proto"
COLLECTION_RES="DataResCollection.proto"

# 通用参数配置
COMMON_PBJS_OPTS=(
    -t static-module
    --no-beautify
    --no-verify
    --no-delimited
)

# 日志输出函数
log() {
    local level=$1
    shift
    local message=$*
    case $level in
        error) echo -e "${RED}[ERROR]${NC} $message" >&2 ;;
        warn)  echo -e "${YELLOW}[WARN]${NC} $message" >&2 ;;
        info)  echo -e "${GREEN}[INFO]${NC} $message" >&2 ;;
        *)     echo "$message" ;;
    esac
}

# 创建集合文件的函数
create_collection() {
    local pattern=$1
    local output_file=$2

    log info "清理旧文件: ${output_file}"
    rm -f "${output_file}" || true
    touch "${output_file}"

    log info "生成集合文件: ${output_file}"
    while IFS= read -r -d '' proto_file; do
        # 修正导入路径：去掉开头的./
        import_path="${proto_file#./}"
        echo "import \"${import_path}\";" >> "${output_file}"
        log info "  ➤ 添加文件: ${proto_file}"
    done < <(find . -type f -path "${pattern}" -print0)
}

# 主执行流程
main() {
    cd "${PROTO_ROOT}" || {
        log error "无法进入目录: ${PROTO_ROOT}"
        exit 1
    }

    # 生成集合文件
    create_collection "./*/DataReq.proto" "${COLLECTION_REQ}"
    create_collection "./*/DataRes.proto" "${COLLECTION_RES}"

    # 准备输出目录
    mkdir -p "${OUTPUT_DIR}" || {
        log error "无法创建输出目录: ${OUTPUT_DIR}"
        exit 1
    }

    # 生成编码文件
    log info "编译生成protobuf编码文件..."
    pbjs "${COMMON_PBJS_OPTS[@]}" -o "${OUTPUT_DIR}/encode.js" \
        "${COLLECTION_REQ}" --no-decode --no-convert || {
        log error "生成encode.js失败"
        exit 1
    }

    # 生成解码文件
    log info "编译生成protobuf解码文件..."
    pbjs "${COMMON_PBJS_OPTS[@]}" -o "${OUTPUT_DIR}/decode.js" \
        "${COLLECTION_RES}" --no-encode --no-create || {
        log error "生成decode.js失败"
        exit 1
    }

    # 生成类型定义
    log info "生成类型定义文件..."
    pbts -o "${OUTPUT_DIR}/encode.d.ts" "${OUTPUT_DIR}/encode.js" --no-comments && \
    pbts -o "${OUTPUT_DIR}/decode.d.ts" "${OUTPUT_DIR}/decode.js" --no-comments || {
        log error "生成类型定义失败"
        exit 1
    }

    log info "重新生成简化版本JS文件..."
    pbjs "${COMMON_PBJS_OPTS[@]}" -o "${OUTPUT_DIR}/encode.js" \
        "${COLLECTION_REQ}" -r 'encode' --no-decode --no-convert --no-comments && \
    pbjs "${COMMON_PBJS_OPTS[@]}" -o "${OUTPUT_DIR}/decode.js" \
        "${COLLECTION_RES}" -r 'decode' --no-encode --no-create --no-comments || {
        log error "重新生成JS文件失败"
        exit 1
    }

    log info "${GREEN}所有操作成功完成！${NC}"
}

main "$@"
