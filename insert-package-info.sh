#!/bin/bash
set -eo pipefail

# 配置颜色代码
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    local level=$1
    shift
    local color=""
    case $level in
        "error") color=${RED} ;;
        "warn") color=${YELLOW} ;;
        "info") color=${BLUE} ;;
        "success") color=${GREEN} ;;
        *) color=${NC} ;;
    esac
    echo -e "${color}[$(date '+%T')] [${level^^}]${NC} $*"
}

# 配置参数
PROTO_ROOT="$(pwd)/src/proto"
TARGET_PACKAGE="package tbclient;"
declare -i TOTAL=0
declare -i MODIFIED=0
declare -i SKIPPED=0

# 检查目录是否存在
check_directory() {
    if [ ! -d "$PROTO_ROOT" ]; then
        log error "目标目录不存在: $PROTO_ROOT"
        exit 1
    fi
}

# 处理单个proto文件
process_proto_file() {
    local file=$1
    ((TOTAL=TOTAL+1))

    # 检查文件是否可读
    if [ ! -r "$file" ]; then
        log warn "文件不可读: ${file}"
        ((SKIPPED+=1))
        return 1
    fi

    # 检查文件内容
    if [ ! -s "$file" ]; then
        log warn "空文件跳过: ${file}"
        ((SKIPPED+=1))
        return 0
    fi

    # 检查是否已包含package
    if grep -q "^${TARGET_PACKAGE}$" "$file"; then
        log info "已存在包声明: ${file}"
        ((SKIPPED+=1))
        return 0
    fi

    # 插入package声明
    sed -i.bak "1i ${TARGET_PACKAGE}" "$file" && rm -f "${file}.bak"

    # 二次验证修改结果
    if grep -q "^${TARGET_PACKAGE}$" "$file"; then
        log success "修改成功: ${file}"
        ((MODIFIED+=1))
    else
        log error "修改失败: ${file}"
        ((SKIPPED+=1))
        return 1
    fi
}

main() {
    check_directory

    log info "开始扫描.proto文件..."

    # 递归查找所有proto文件（处理含空格路径）
    while IFS= read -r -d '' file; do
        process_proto_file "$file"
    done < <(find "$PROTO_ROOT" -type f -name "*.proto" -print0)

    log info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log success "处理完成！统计结果："
    echo -e "• 总文件数: ${BLUE}${TOTAL}${NC}"
    echo -e "• 成功修改: ${GREEN}${MODIFIED}${NC}"
    echo -e "• 跳过处理: ${YELLOW}${SKIPPED}${NC}"
    log info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    sleep 1
}

main "$@"
