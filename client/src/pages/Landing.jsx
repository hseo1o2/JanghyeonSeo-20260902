import { useNavigate } from 'react-router-dom';
import { startExperiment } from '../api/client.js';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  async function handleStart() {
    try {
      const { sessionId, condition, candidateIds } = await startExperiment();
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('condition', condition);
      localStorage.setItem('candidateIds', JSON.stringify(candidateIds));
      localStorage.setItem('candidateIndex', '0');
      navigate('/experiment');
    } catch (err) {
      console.error(err);
      alert('서버 연결에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <main className="landing">
      <div className="landing-content">
        <p className="landing-eyebrow">Daily-life-first experiment</p>
        <h1 className="landing-title">
          프로필보다 하루를 먼저 보면,<br />
          사람을 다르게 보게 될까요?
        </h1>
        <p className="landing-desc">
          몇 명의 후보를 보고 더 알아보고 싶은 사람을 선택해주세요.<br />
          약 2~3분 소요됩니다.
        </p>
        <button className="btn-primary landing-cta" onClick={handleStart}>
          시작하기
        </button>
      </div>
    </main>
  );
}
