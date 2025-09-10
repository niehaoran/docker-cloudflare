#!/bin/bash

# =============================================================================
# Cloudflare 防火墙自动更新管理器
# =============================================================================
# 
# 使用前请先配置以下信息：
# 
# 1. ZONE_ID     - 在 Cloudflare Dashboard 右下角找到
# 2. RULESET_ID  - 在 Security > WAF 中创建规则后获得
# 3. RULE_ID     - 具体防火墙规则的 ID
# 4. CF_AUTH_TOKEN - 在 My Profile > API Tokens 创建
# 
# =============================================================================

# 配置信息 - 请修改为你的Cloudflare信息
ZONE_ID="YOUR_ZONE_ID_HERE"
RULESET_ID="YOUR_RULESET_ID_HERE"
RULE_ID="YOUR_RULE_ID_HERE"
CF_AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"
UPDATE_INTERVAL=300  # 5分钟检查一次
RULE_DESCRIPTION="仅允许指定 IP 地址"

# 文件路径
CONFIG_FILE="$HOME/.cloudflare-firewall-config"
LOG_FILE="/tmp/cloudflare-firewall.log"
PID_FILE="/tmp/cloudflare-firewall.pid"
SERVICE_FILE="/tmp/cloudflare-firewall-service.sh"
LAST_IP_FILE="/tmp/cloudflare-last-ip"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# 清屏函数
clear_screen() {
    clear
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${WHITE}Cloudflare 防火墙管理器${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
}

# 日志函数
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case $level in
        "INFO")  echo -e "${CYAN}ℹ️ $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️ $message${NC}" ;;
    esac
}

# 等待按键
wait_for_key() {
    echo ""
    echo -e "${YELLOW}按回车继续...${NC}"
    read
}

# 检查依赖
check_dependencies() {
    for cmd in curl jq; do
        if ! command -v $cmd >/dev/null 2>&1; then
            log "WARNING" "缺少依赖: $cmd，尝试自动安装..."
            
            if command -v apt-get >/dev/null 2>&1; then
                echo "正在安装 $cmd (Ubuntu/Debian)..."
                sudo apt-get update && sudo apt-get install -y $cmd
            elif command -v yum >/dev/null 2>&1; then
                echo "正在安装 $cmd (CentOS/RHEL)..."
                sudo yum install -y $cmd
            elif command -v dnf >/dev/null 2>&1; then
                echo "正在安装 $cmd (Fedora)..."
                sudo dnf install -y $cmd
            elif command -v pacman >/dev/null 2>&1; then
                echo "正在安装 $cmd (Arch Linux)..."
                sudo pacman -S --noconfirm $cmd
            elif command -v zypper >/dev/null 2>&1; then
                echo "正在安装 $cmd (openSUSE)..."
                sudo zypper install -y $cmd
            else
                echo ""
                echo -e "${RED}❌ 无法自动安装 $cmd${NC}"
                echo -e "${YELLOW}请手动安装:${NC}"
                echo "  Ubuntu/Debian: sudo apt-get install $cmd"
                echo "  CentOS/RHEL:   sudo yum install $cmd"
                echo "  Fedora:        sudo dnf install $cmd"
                echo "  Arch Linux:    sudo pacman -S $cmd"
                echo ""
                exit 1
            fi
            
            # 验证安装
            if command -v $cmd >/dev/null 2>&1; then
                log "SUCCESS" "$cmd 安装成功"
            else
                log "ERROR" "$cmd 安装失败"
                exit 1
            fi
        fi
    done
}

# 验证配置
validate_config() {
    local missing_configs=()
    
    if [[ "$ZONE_ID" == "YOUR_ZONE_ID_HERE" ]]; then
        missing_configs+=("ZONE_ID")
    fi
    
    if [[ "$RULESET_ID" == "YOUR_RULESET_ID_HERE" ]]; then
        missing_configs+=("RULESET_ID")
    fi
    
    if [[ "$RULE_ID" == "YOUR_RULE_ID_HERE" ]]; then
        missing_configs+=("RULE_ID")
    fi
    
    if [[ "$CF_AUTH_TOKEN" == "YOUR_AUTH_TOKEN_HERE" ]]; then
        missing_configs+=("CF_AUTH_TOKEN")
    fi
    
    if [ ${#missing_configs[@]} -gt 0 ]; then
        echo -e "${RED}❌ 配置未完成！${NC}"
        echo -e "${YELLOW}请在脚本顶部设置以下配置:${NC}"
        for config in "${missing_configs[@]}"; do
            echo "  • $config"
        done
        echo ""
        echo -e "${CYAN}如何获取这些配置信息:${NC}"
        echo "1. 访问 Cloudflare Dashboard"
        echo "2. 选择你的域名"
        echo "3. 在右下角找到 Zone ID"
        echo "4. 前往 Security > WAF，创建防火墙规则获取 RULESET_ID 和 RULE_ID"
        echo "5. 在 My Profile > API Tokens 创建 API Token"
        echo ""
        return 1
    fi
    
    return 0
}

# 加载配置
load_config() {
    validate_config
    return $?
}

# 保存配置
save_config() {
    cat > "$CONFIG_FILE" << EOF
CF_AUTH_TOKEN="$CF_AUTH_TOKEN"
EOF
    chmod 600 "$CONFIG_FILE"
    log "SUCCESS" "API Token已保存"
}

# 获取当前IP
get_current_ip() {
    local services=("ifconfig.me" "https://checkip.amazonaws.com" "https://ipinfo.io/ip" "https://icanhazip.com")
    
    for service in "${services[@]}"; do
        local ip=$(curl -s --max-time 10 "$service" | tr -d '\n\r')
        if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo "$ip"
            return 0
        fi
    done
    return 1
}

# 获取上次IP
get_last_ip() {
    if [ -f "$LAST_IP_FILE" ]; then
        cat "$LAST_IP_FILE"
    fi
}

# 保存IP
save_current_ip() {
    echo "$1" > "$LAST_IP_FILE"
}

# 更新防火墙规则
update_firewall_rule() {
    local new_ip=$1
    
    log "INFO" "更新防火墙规则: $new_ip"
    
    local response=$(curl -s -X PATCH \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$RULESET_ID/rules/$RULE_ID" \
        -H "Authorization: Bearer $CF_AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"action\": \"block\",
            \"description\": \"$RULE_DESCRIPTION - IP: $new_ip [$(date '+%Y-%m-%d %H:%M:%S')]\",
            \"enabled\": true,
            \"expression\": \"(ip.src ne $new_ip)\"
        }")
    
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        log "SUCCESS" "规则更新成功 - 允许IP: $new_ip"
        save_current_ip "$new_ip"
        return 0
    else
        log "ERROR" "规则更新失败: $response"
        return 1
    fi
}

# 检查并更新
check_and_update() {
    local current_ip=$(get_current_ip)
    local last_ip=$(get_last_ip)
    
    if [ -z "$current_ip" ]; then
        log "ERROR" "无法获取当前IP"
        return 1
    fi
    
    if [ "$current_ip" != "$last_ip" ]; then
        log "INFO" "IP变化: $last_ip -> $current_ip"
        update_firewall_rule "$current_ip"
    else
        log "INFO" "IP无变化: $current_ip"
    fi
}

# 创建后台服务
create_service_script() {
    cat > "$SERVICE_FILE" << EOF
#!/bin/bash

# 配置信息
ZONE_ID="$ZONE_ID"
RULESET_ID="$RULESET_ID"
RULE_ID="$RULE_ID"
CF_AUTH_TOKEN="$CF_AUTH_TOKEN"
UPDATE_INTERVAL="$UPDATE_INTERVAL"
RULE_DESCRIPTION="$RULE_DESCRIPTION"

CONFIG_FILE="$CONFIG_FILE"
LOG_FILE="$LOG_FILE"
LAST_IP_FILE="$LAST_IP_FILE"

# 日志函数
log() {
    local level=\$1
    shift
    local message="\$*"
    local timestamp=\$(date '+%Y-%m-%d %H:%M:%S')
    echo "[\$timestamp] [\$level] \$message" >> "\$LOG_FILE"
}

# 获取IP
get_current_ip() {
    local services=("ifconfig.me" "https://checkip.amazonaws.com" "https://ipinfo.io/ip" "https://icanhazip.com")
    for service in "\${services[@]}"; do
        local ip=\$(curl -s --max-time 10 "\$service" | tr -d '\n\r')
        if [[ \$ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\$ ]]; then
            echo "\$ip"
            return 0
        fi
    done
    return 1
}

get_last_ip() {
    if [ -f "\$LAST_IP_FILE" ]; then
        cat "\$LAST_IP_FILE"
    fi
}

save_current_ip() {
    echo "\$1" > "\$LAST_IP_FILE"
}

# 更新规则
update_firewall_rule() {
    local new_ip=\$1
    log "INFO" "更新防火墙规则: \$new_ip"
    
    local response=\$(curl -s -X PATCH \\
        "https://api.cloudflare.com/client/v4/zones/\$ZONE_ID/rulesets/\$RULESET_ID/rules/\$RULE_ID" \\
        -H "Authorization: Bearer \$CF_AUTH_TOKEN" \\
        -H "Content-Type: application/json" \\
        -d "{
            \\"action\\": \\"block\\",
            \\"description\\": \\"\$RULE_DESCRIPTION - IP: \$new_ip [\$(date '+%Y-%m-%d %H:%M:%S')]\\",
            \\"enabled\\": true,
            \\"expression\\": \\"(ip.src ne \$new_ip)\\"
        }")
    
    if echo "\$response" | jq -e '.success' > /dev/null 2>&1; then
        log "SUCCESS" "规则更新成功 - IP: \$new_ip"
        save_current_ip "\$new_ip"
        return 0
    else
        log "ERROR" "规则更新失败: \$response"
        return 1
    fi
}

# 检查更新
check_and_update() {
    local current_ip=\$(get_current_ip)
    local last_ip=\$(get_last_ip)
    
    if [ -z "\$current_ip" ]; then
        log "ERROR" "无法获取当前IP"
        return 1
    fi
    
    if [ "\$current_ip" != "\$last_ip" ]; then
        log "INFO" "IP变化: \$last_ip -> \$current_ip"
        update_firewall_rule "\$current_ip"
    else
        log "INFO" "IP无变化: \$current_ip"
    fi
}

# 主循环
log "INFO" "防火墙自动更新服务启动"
while true; do
    check_and_update
    sleep "\$UPDATE_INTERVAL"
done
EOF
    chmod +x "$SERVICE_FILE"
}

# 启动服务
start_service() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        log "WARNING" "服务已在运行"
        return 1
    fi
    
    create_service_script
    nohup "$SERVICE_FILE" > /dev/null 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 2
    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        log "SUCCESS" "服务启动成功 (PID: $(cat "$PID_FILE"))"
        return 0
    else
        log "ERROR" "服务启动失败"
        return 1
    fi
}

# 停止服务
stop_service() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm -f "$PID_FILE"
            log "SUCCESS" "服务已停止"
            return 0
        else
            rm -f "$PID_FILE"
            log "WARNING" "服务未运行"
            return 1
        fi
    else
        log "WARNING" "服务未运行"
        return 1
    fi
}

# 服务状态
get_service_status() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo -e "${GREEN}运行中 (PID: $(cat "$PID_FILE"))${NC}"
        return 0
    else
        echo -e "${RED}已停止${NC}"
        return 1
    fi
}

# 设置API Token
setup_token() {
    clear_screen
    echo -e "${CYAN}API Token 设置${NC}"
    echo "==============================="
    echo ""
    echo -e "${YELLOW}如何获取 Cloudflare API Token:${NC}"
    echo "1. 访问: https://dash.cloudflare.com/profile/api-tokens"
    echo "2. 点击 'Create Token'"
    echo "3. 选择 'Edit zone DNS' 模板"
    echo "4. 或者使用自定义权限:"
    echo "   - Zone:Zone:Read"
    echo "   - Zone:DNS:Edit"
    echo "5. 复制生成的Token"
    echo ""
    
    while true; do
        echo -n -e "${YELLOW}请输入 Cloudflare API Token: ${NC}"
        read -s CF_AUTH_TOKEN
        echo ""
        if [ -n "$CF_AUTH_TOKEN" ]; then
            break
        else
            echo -e "${RED}Token 不能为空！${NC}"
        fi
    done
    
    echo ""
    echo -e "${CYAN}测试连接...${NC}"
    
    local test_response=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID" \
        -H "Authorization: Bearer $CF_AUTH_TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$test_response" | jq -e '.success' > /dev/null 2>&1; then
        log "SUCCESS" "API连接成功"
        save_config
        echo ""
        echo -e "${GREEN}✅ 设置完成！${NC}"
    else
        log "ERROR" "API连接失败"
        echo -e "${RED}❌ Token无效，请重新设置${NC}"
        wait_for_key
        return 1
    fi
    
    wait_for_key
}

# 查看日志
view_logs() {
    clear_screen
    echo -e "${CYAN}日志查看${NC}"
    echo "======================"
    echo ""
    
    if [ ! -f "$LOG_FILE" ]; then
        echo -e "${YELLOW}暂无日志${NC}"
        wait_for_key
        return
    fi
    
    echo "1) 最近50行"
    echo "2) 全部日志"
    echo "3) 实时监控"
    echo "4) 清空日志"
    echo "5) 返回"
    echo ""
    echo -n -e "${YELLOW}选择: ${NC}"
    read choice
    
    case $choice in
        1)
            clear_screen
            tail -50 "$LOG_FILE"
            wait_for_key
            ;;
        2)
            clear_screen
            cat "$LOG_FILE"
            wait_for_key
            ;;
        3)
            clear_screen
            echo "实时监控 (Ctrl+C退出)"
            tail -f "$LOG_FILE"
            ;;
        4)
            echo -n "确认清空? [y/N]: "
            read confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                > "$LOG_FILE"
                log "INFO" "日志已清空"
            fi
            ;;
        5) return ;;
    esac
    
    view_logs
}

# 服务管理
service_management() {
    clear_screen
    echo -e "${CYAN}服务管理${NC}"
    echo "===================="
    echo ""
    
    echo -n "状态: "
    get_service_status
    echo ""
    
    echo "1) 启动服务"
    echo "2) 停止服务"
    echo "3) 重启服务"
    echo "4) 立即更新"
    echo "5) 查看当前IP"
    echo "6) 返回"
    echo ""
    echo -n -e "${YELLOW}选择: ${NC}"
    read choice
    
    case $choice in
        1)
            echo ""
            start_service
            wait_for_key
            ;;
        2)
            echo ""
            stop_service
            wait_for_key
            ;;
        3)
            echo ""
            stop_service
            sleep 1
            start_service
            wait_for_key
            ;;
        4)
            echo ""
            if load_config; then
                check_and_update
            else
                log "ERROR" "请先设置API Token"
            fi
            wait_for_key
            ;;
        5)
            echo ""
            local current_ip=$(get_current_ip)
            local last_ip=$(get_last_ip)
            echo -e "当前IP: ${WHITE}$current_ip${NC}"
            echo -e "记录IP: ${WHITE}$last_ip${NC}"
            wait_for_key
            ;;
        6) return ;;
    esac
    
    service_management
}

# 卸载
uninstall() {
    clear_screen
    echo -e "${RED}卸载程序${NC}"
    echo "=================="
    echo ""
    
    echo -e "${YELLOW}将删除:${NC}"
    echo "• $CONFIG_FILE"
    echo "• $LOG_FILE"
    echo "• $PID_FILE"
    echo "• $SERVICE_FILE"
    echo "• $LAST_IP_FILE"
    echo ""
    echo -n -e "${RED}确认卸载? [y/N]: ${NC}"
    read confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo ""
        stop_service
        
        local files=("$CONFIG_FILE" "$LOG_FILE" "$PID_FILE" "$SERVICE_FILE" "$LAST_IP_FILE")
        for file in "${files[@]}"; do
            if [ -f "$file" ]; then
                rm -f "$file"
                echo -e "${GREEN}已删除: $file${NC}"
            fi
        done
        
        echo ""
        echo -e "${GREEN}卸载完成${NC}"
        exit 0
    else
        echo -e "${CYAN}取消卸载${NC}"
        wait_for_key
    fi
}

# 主菜单
show_main_menu() {
    clear_screen
    
    echo -n "• 配置: "
    if validate_config >/dev/null 2>&1; then
        echo -e "${GREEN}已完成${NC}"
    else
        echo -e "${RED}未完成${NC}"
    fi
    
    echo -n "• 服务: "
    get_service_status > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}运行中${NC}"
    else
        echo -e "${RED}已停止${NC}"
    fi
    
    echo -n "• 当前IP: "
    local current_ip=$(get_current_ip)
    if [ -n "$current_ip" ]; then
        echo -e "${CYAN}$current_ip${NC}"
    else
        echo -e "${RED}获取失败${NC}"
    fi
    
    echo ""
    echo "1) 设置API Token"
    echo "2) 服务管理"
    echo "3) 查看日志"
    echo "4) 卸载"
    echo "5) 退出"
    echo ""
    echo -n -e "${YELLOW}选择: ${NC}"
    read choice
    
    case $choice in
        1) setup_token ;;
        2) service_management ;;
        3) view_logs ;;
        4) uninstall ;;
        5) exit 0 ;;
        *) 
            echo -e "${RED}无效选择${NC}"
            wait_for_key
            ;;
    esac
}

# 主函数
main() {
    check_dependencies
    touch "$LOG_FILE"
    log "INFO" "程序启动"
    
    while true; do
        show_main_menu
    done
}

main "$@" 