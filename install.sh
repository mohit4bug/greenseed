#!/bin/sh
# Install Greenseed - the PostgreSQL seed CLI tool
# Usage: curl -fsSL https://raw.githubusercontent.com/mohit4bug/greenseed/main/install.sh | bash
#        curl -fsSL https://raw.githubusercontent.com/mohit4bug/greenseed/main/install.sh | bash -s -- -b /usr/local/bin

set -euf

BINARY="greenseed"
REPO="mohit4bug/greenseed"
VERSION="${GREENSEED_VERSION:-}"
INSTALL_DIR="${GREENSEED_INSTALL_DIR:-}"

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Error: $1 is required but not installed." >&2
		exit 1
	fi
}

detect_os_arch() {
	OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
	ARCH="$(uname -m)"

	case "$OS" in
		linux) TARGET_OS="linux" ;;
		darwin) TARGET_OS="darwin" ;;
		*) echo "Error: unsupported OS: $OS" >&2; exit 1 ;;
	esac

	case "$ARCH" in
		x86_64 | amd64) TARGET_ARCH="x64" ;;
		aarch64 | arm64) TARGET_ARCH="arm64" ;;
		*) echo "Error: unsupported architecture: $ARCH" >&2; exit 1 ;;
	esac
}

resolve_version() {
	if [ -n "$VERSION" ]; then
		return
	fi

	echo "Fetching latest version..."
	VERSION="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)"

	if [ -z "$VERSION" ]; then
		echo "Error: could not determine latest version." >&2
		exit 1
	fi
}

resolve_install_dir() {
	if [ -n "$INSTALL_DIR" ]; then
		return
	fi

	if [ "$(id -u)" -eq 0 ]; then
		INSTALL_DIR="/usr/local/bin"
	else
		INSTALL_DIR="${HOME}/.local/bin"
	fi

	mkdir -p "$INSTALL_DIR"
}

install_binary() {
	DOWNLOAD_URL="https://github.com/$REPO/releases/download/$VERSION/${BINARY}-${TARGET_OS}-${TARGET_ARCH}"

	echo "Downloading Greenseed $VERSION for $TARGET_OS/$TARGET_ARCH..."
	curl -fsSL "$DOWNLOAD_URL" -o "$INSTALL_DIR/$BINARY"
	chmod +x "$INSTALL_DIR/$BINARY"

	echo "Installed Greenseed $VERSION to $INSTALL_DIR/$BINARY"
}

verify_installation() {
	if ! command -v "$BINARY" >/dev/null 2>&1; then
		echo "Warning: $BINARY not found in PATH. Make sure $INSTALL_DIR is in your PATH."
		echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
	fi
}

main() {
	while getopts "b:v:" opt; do
		case "$opt" in
			b) INSTALL_DIR="$OPTARG" ;;
			v) VERSION="$OPTARG" ;;
			*) echo "Usage: $0 [-b install_dir] [-v version]" >&2; exit 1 ;;
		esac
	done

	require_command "curl"
	require_command "uname"

	detect_os_arch
	resolve_version
	resolve_install_dir
	install_binary
	verify_installation

	echo "Run 'greenseed --help' to get started."
}

main "$@"
