import Header from '../../components/Header/Header';
import Hero from '../../components/Hero/Hero';
import Programs from '../../components/Programs/Programs';

const LandingPage = ({ onOpenAuth }) => {
  return (
    <>
      <Header onOpenAuth={onOpenAuth} />
      <main className="main">
        <Hero />
        <Programs onOpenAuth={onOpenAuth} />
      </main>
    </>
  );
};

export default LandingPage;