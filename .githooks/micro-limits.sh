# Batas micro-commit. Satu sumber, dipakai pre-commit + pre-push.
MICRO_MAX_FILES=10
MICRO_MAX_ADD=300

# File generated/lock dikecualikan dari hitungan (bukan kerja manusia).
micro_excluded() {
  case "$1" in
    bun.lock*|package-lock.json|pnpm-lock.yaml|yarn.lock|*.lockb|src/types/database.ts) return 0;;
  esac
  return 1
}

# stdin: baris numstat "tambah\thapus\tpath". stdout: "jumlah_file total_tambah".
micro_sum() {
  TAB=$(printf '\t')
  files=0; adds=0
  while IFS="$TAB" read -r add _ path; do
    [ -z "$path" ] && continue
    if micro_excluded "$path"; then continue; fi
    files=$((files + 1))
    case "$add" in ''|-) ;; *) adds=$((adds + add));; esac
  done
  echo "$files $adds"
}
