const industryMap = {
  "BtoBサービス・IT": ["SaaS", "ITサービス", "システム開発", "Web制作", "AI・データ分析", "DX支援", "広告代理店", "SEO・コンテンツ支援"],
  "コンサル・士業・専門サービス": ["経営コンサルティング", "マーケティングコンサルティング", "税理士", "弁護士", "社会保険労務士"],
  "製造・メーカー・卸": ["食品メーカー", "工業製品メーカー", "機械メーカー", "商社", "卸売"],
  "不動産・建設・住宅": ["不動産仲介", "不動産管理", "建設会社", "工務店", "リフォーム"],
  "医療・美容・福祉": ["クリニック", "歯科医院", "美容医療", "介護施設", "整体・整骨院"],
  "その他": ["その他法人", "未定"]
};

function setupIndustrySelect() {
  const major = document.querySelector("#major-industry");
  const minor = document.querySelector("#minor-industry");
  if (!major || !minor) return;
  Object.keys(industryMap).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    major.appendChild(option);
  });
  major.addEventListener("change", () => {
    minor.innerHTML = '<option value="">選択してください</option>';
    (industryMap[major.value] || []).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      minor.appendChild(option);
    });
    minor.disabled = !major.value;
  });
}

function setupDemoSubmit() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    if (note) note.textContent = "送信デモです。本番公開時に送信先APIまたはフォームサービスへ接続してください。";
  });
}

setupIndustrySelect();
setupDemoSubmit();
