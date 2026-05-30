# Storage 아시아 리전 이전 (US-EAST1 → 서울)

현재 기본 버킷이 **US-EAST1**(미국 동부)이면 한국에서 업로드가 느립니다.  
**새 버킷**을 `asia-northeast3`(서울)에 만들고, 앱 env만 바꿔 **새 사진부터** 빠르게 올립니다.

> 기존 US 버킷에 있는 사진 URL은 **그대로** 보입니다. (DB에 저장된 URL 유지)

---

## 권장 버킷 이름

| 항목 | 값 |
|------|-----|
| 버킷 이름 | `qadm-29e97-asia-ne3` |
| 리전 | `asia-northeast3` (서울) |
| env 변수 | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=qadm-29e97-asia-ne3` |

이름은 **전 세계에서 유일**해야 합니다. 이미 사용 중이면 `qadm-asia-ne3-본인식별` 등으로 바꾸고, 아래 `firebase.json`의 두 번째 `bucket` 값도 같이 수정하세요.

---

## 1단계: Google Cloud 콘솔에서 버킷 만들기 (클릭)

Firebase Storage 화면에는 Location이 잘 안 보일 때가 많아, **GCP 콘솔**에서 만드는 방법이 가장 확실합니다.

1. 브라우저에서 아래 링크 열기 (프로젝트 `qadm-29e97`):
   - https://console.cloud.google.com/storage/create-bucket?project=qadm-29e97

2. **Name your bucket**
   - `qadm-29e97-asia-ne3` 입력

3. **Choose where to store your data**
   - **Region** 선택
   - Location: **`asia-northeast3 (Seoul)`**

4. **Choose a storage class for your data**
   - **Standard** (기본값)

5. **Choose how to control access to objects**
   - **Uniform** (권장, 기본값)
   - “Enforce public access prevention”은 **켜도 됨** (앱은 rules + URL로 접근)

6. **Choose how to protect object data**  
   - 기본값 그대로 **Create** 클릭

7. 완료 후 버킷 목록에서 확인:
   - https://console.cloud.google.com/storage/browser?project=qadm-29e97
   - `qadm-29e97-asia-ne3` · Location **`asia-northeast3`**

---

## 2단계: CORS 설정 (브라우저 업로드 필수)

GCP에서 직접 만든 버킷은 **CORS**가 없으면 브라우저에서 `storage/unauthorized` 또는 CORS 오류가 납니다.

> **로컬 PC에 `gcloud`가 없어도 됩니다.** (PowerShell에서 `gcloud` 명령이 안 되는 것은 정상)  
> 아래 **방법 A(콘솔 UI)** 또는 **방법 B(Cloud Shell 붙여넣기)** 만 쓰세요.

---

### 방법 A — GCP 콘솔 UI (가장 쉬움, gcloud 불필요)

1. 버킷 **Configuration** 탭 열기:  
   https://console.cloud.google.com/storage/browser/qadm-29e97-asia-ne3;tab=configuration?project=qadm-29e97

2. 아래로 스크롤 → **Cross-origin resource sharing (CORS)** 섹션

3. **Edit CORS configuration** (또는 **Edit cross-origin resource sharing**) 클릭

4. **Allow cross-origin resource sharing** 체크

5. **Add a configuration** → 아래 값 입력:

| 필드 | 입력 값 |
|------|---------|
| **List of allowed origins** | 한 줄에 하나씩 3개 추가 |
| | `http://localhost:3000` |
| | `https://qadm.vercel.app` |
| | `https://*.vercel.app` |
| **Specify methods** | `GET`, `HEAD`, `PUT`, `POST`, `DELETE`, `OPTIONS` 전부 선택 |
| **List of allowed response headers** | 한 줄에 하나씩 추가 |
| | `Content-Type` |
| | `Content-Range` |
| | `Content-Length` |
| | `Authorization` |
| | `x-goog-resumable` |
| **Cache expiry time** | `3600` |

6. **Done** → **Save**

7. 저장 후 같은 화면에서 CORS 설정이 보이면 성공.

**Configuration 탭에 CORS가 안 보일 때**

- 버킷 목록에서 `qadm-29e97-asia-ne3` **이름 클릭** → 상단 **Configuration** 탭
- 또는 **⋮ (더보기) → Edit bucket** 안에 CORS 항목 확인

---

### 방법 B — Cloud Shell (복사·붙여넣기 한 번)

로컬에 `storage.cors.json`이 없어도 됩니다. **아래 블록 전체**를 Cloud Shell에 붙여넣고 Enter.

1. GCP 콘솔 우측 상단 **`>_` Activate Cloud Shell** 클릭 (처음이면 권한 허용)
2. 아래 **전체** 복사 → Shell에 붙여넣기 → Enter

```bash
cat > /tmp/qadm-cors.json << 'EOF'
[
  {
    "origin": [
      "http://localhost:3000",
      "https://qadm.vercel.app",
      "https://*.vercel.app"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
    "responseHeader": [
      "Content-Type",
      "Content-Range",
      "Content-Length",
      "Authorization",
      "x-goog-resumable"
    ],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update gs://qadm-29e97-asia-ne3 \
  --cors-file=/tmp/qadm-cors.json \
  --project=qadm-29e97

gcloud storage buckets describe gs://qadm-29e97-asia-ne3 \
  --project=qadm-29e97 \
  --format="json(cors_config)"
```

3. 마지막 줄에 `"cors_config": [...]` 내용이 출력되면 성공.

**Cloud Shell 오류**

| 메시지 | 해결 |
|--------|------|
| `Bucket not found` | 1단계에서 버킷 이름이 `qadm-29e97-asia-ne3`인지 확인 |
| `Permission denied` | 로그인 Google 계정이 Firebase 프로젝트 **Owner/Editor**인지 확인 |
| `gcloud: command not found` | Shell 창이 아니라 로컬 PowerShell에서 실행한 것 — Shell에서 다시 |

---

### (참고) 로컬 PowerShell — gcloud 설치된 PC만

```powershell
cd C:\Users\박정우\Desktop\QADM\qadm
gcloud storage buckets update gs://qadm-29e97-asia-ne3 --cors-file=storage.cors.json --project=qadm-29e97
```

`gcloud`가 없다고 나오면 **방법 A 또는 B**를 쓰세요.

---

## 3단계: Storage 보안 규칙 배포

프로젝트 `firebase.json`에 **US 기본 버킷 + 아시아 버킷** 둘 다 rules가 등록되어 있습니다.

### Firebase 콘솔에서 rules 붙여넣기 (클릭)

1. https://console.firebase.google.com/project/qadm-29e97/storage
2. 상단 **Rules** 탭
3. 버킷 선택 드롭다운이 있으면 **`qadm-29e97-asia-ne3`** 선택
4. 프로젝트 루트 `storage.rules` 내용 **전체 복사 → 붙여넣기**
5. **Publish (게시)** 클릭

> 드롭다운에 새 버킷이 안 보이면 아래 CLI 방법 사용.

### Firebase CLI (로컬)

```bash
npm i -g firebase-tools
firebase login
cd qadm
firebase deploy --only storage --project qadm-29e97
```

---

## 4단계: 환경 변수 변경

### 로컬 `.env.local`

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=qadm-29e97-asia-ne3
```

(Admin 서버 업로드를 쓰는 경우)

```env
FIREBASE_STORAGE_BUCKET=qadm-29e97-asia-ne3
```

### Vercel

**Settings → Environment Variables**에서  
`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` 값을 `qadm-29e97-asia-ne3`로 변경.

또는:

```powershell
$env:VERCEL_TOKEN="토큰"
npm run vercel:sync-env
```

### Redeploy

Vercel **Deployments → Redeploy** (env 변경 후 필수)

---

## 5단계: 동작 확인

1. https://qadm.vercel.app (또는 로컬) → 서식 작성 → 사진 1장 업로드
2. 업로드 후 URL에 버킷 이름 포함 여부 확인 (개발자 도구 Network)
3. GCP Console → `qadm-29e97-asia-ne3` → **forms/** 폴더에 파일 생성됐는지 확인
4. 상세 페이지에서 사진 표시 확인

---

## Firebase 콘솔만으로 Location 확인하기

| 경로 | 보이는 것 |
|------|-----------|
| Firebase → **Storage** → **Files** | 버킷 이름 (Location은 없을 수 있음) |
| GCP → **Cloud Storage** → **Buckets** | **Location** 열에 `asia-northeast3` / `US-EAST1` |

직접 링크: https://console.cloud.google.com/storage/browser?project=qadm-29e97

---

## 자주 묻는 것

**Q. 예전 US 버킷 사진은?**  
A. DB에 저장된 URL 그대로 US에서 읽습니다. 새로 올리는 것만 서울 버킷 사용.

**Q. US 버킷 삭제해도 되나?**  
A. 예전 사진이 있으면 **삭제하지 마세요**. 새 버킷만 쓰면 됩니다.

**Q. `storage/unauthorized` 오류**  
A. 3단계 rules 게시 + 2단계 CORS 확인.

**Q. 버킷 이름을 다르게 만들었어요**  
A. `firebase.json`의 `"bucket": "..."` 두 번째 항목과 env 값을 **같은 이름**으로 맞추세요.
