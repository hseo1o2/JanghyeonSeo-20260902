import { useState } from 'react';
import { submitSurvey } from '../api/client.js';
import './Complete.css';

const Q1_OPTIONS = [
  { value: 'daily_concrete', label: '생활이 구체적으로 보여서' },
  { value: 'common_ground',  label: '공통점이 보여서' },
  { value: 'less_judged',    label: '바로 평가하는 느낌이 덜해서' },
  { value: 'profile_info',   label: '사진 / 프로필 정보가 도움이 됐어서' },
  { value: 'other',          label: '기타' },
];

export default function Complete() {
  const sessionId  = localStorage.getItem('sessionId');
  const condition  = localStorage.getItem('condition');

  const [q1, setQ1]       = useState(null);
  const [q2, setQ2]       = useState(null);
  const [q3, setQ3]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!sessionId) { setError('세션 정보가 없어요.'); return; }
    setLoading(true);
    setError(null);
    try {
      await submitSurvey({
        sessionId,
        condition,
        q1Reason:   q1 ?? undefined,
        q2Score:    q2 ?? undefined,
        q3Freetext: q3.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      setError('제출 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="complete-wrap">
        <div className="complete-card">
          <p className="complete-emoji">🙏</p>
          <h1 className="complete-title">참여해 주셔서 감사해요</h1>
          <p className="complete-desc">
            여러분의 반응이 더 나은 소개팅 경험을 만드는 데<br />
            직접적인 도움이 됩니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="complete-wrap">
      <div className="complete-card">
        <p className="complete-eyebrow">설문 · 1분 이내</p>
        <h1 className="complete-title">마지막 질문이에요</h1>
        <p className="complete-desc">선택 사항이에요. 솔직한 답변이 큰 도움이 됩니다.</p>

        <form className="survey-form" onSubmit={handleSubmit}>

          {/* Q1 */}
          <fieldset className="survey-fieldset">
            <legend className="survey-legend">
              어떤 점에서 "더 알아보고 싶다"는 생각이 들었나요?
              <span className="survey-optional">선택</span>
            </legend>
            <div className="survey-options">
              {Q1_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`survey-option ${q1 === opt.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="q1"
                    value={opt.value}
                    checked={q1 === opt.value}
                    onChange={() => setQ1(q1 === opt.value ? null : opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Q2 */}
          <fieldset className="survey-fieldset">
            <legend className="survey-legend">
              정보를 보여주는 방식이 얼마나 자연스러웠나요?
              <span className="survey-optional">선택</span>
            </legend>
            <div className="survey-score-wrap">
              <span className="survey-score-label">매우 어색함</span>
              <div className="survey-score-btns">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`survey-score-btn ${q2 === n ? 'selected' : ''}`}
                    onClick={() => setQ2(q2 === n ? null : n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="survey-score-label">매우 자연스러움</span>
            </div>
          </fieldset>

          {/* Q3 */}
          <fieldset className="survey-fieldset">
            <legend className="survey-legend">
              자유롭게 의견을 남겨주세요
              <span className="survey-optional">선택</span>
            </legend>
            <textarea
              className="survey-textarea"
              placeholder="어떤 점이 좋았거나 아쉬웠나요?"
              rows={3}
              maxLength={500}
              value={q3}
              onChange={e => setQ3(e.target.value)}
            />
          </fieldset>

          {error && <p className="survey-error">{error}</p>}

          <button
            type="submit"
            className="btn-primary survey-submit"
            disabled={loading}
          >
            {loading ? '제출 중…' : '제출하기'}
          </button>

          <button
            type="button"
            className="survey-skip"
            onClick={async () => {
              if (!sessionId) { setSubmitted(true); return; }
              try { await submitSurvey({ sessionId, condition }); } catch { /* ignore */ }
              setSubmitted(true);
            }}
          >
            건너뛰기
          </button>
        </form>
      </div>
    </main>
  );
}
