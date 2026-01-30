import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sunrise, Sunset, Search, Calendar, Moon, Sun, 
  Sparkles, ChevronRight, LogOut, Shuffle, Plus, X, 
  AlertCircle, Eye, EyeOff, CheckCircle, Download, Upload
} from 'lucide-react';
import { auth, db } from './config/firebase-config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import './App.css';

function App() {
  // Estados de Autenticação
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Navegação
  const [view, setView] = useState('today');
  const [theme, setTheme] = useState('light');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do Prólogo
  const [morningDone, setMorningDone] = useState(false);
  const [selectedVirtue, setSelectedVirtue] = useState('');
  const [customVirtue, setCustomVirtue] = useState('');
  const [showCustomVirtue, setShowCustomVirtue] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(null);
  const [dailyIntention, setDailyIntention] = useState('');
  const [lastDrawDate, setLastDrawDate] = useState(null);

  // Estados do Epílogo
  const [eveningDone, setEveningDone] = useState(false);
  const [whereIFailed, setWhereIFailed] = useState('');
  const [whatIDidWell, setWhatIDidWell] = useState('');
  const [whatILeftUndone, setWhatILeftUndone] = useState('');

  // Estados de Histórico
  const [entries, setEntries] = useState([]);

  // Virtudes
  const virtues = [
    {
      name: "Paciência",
      description: "A capacidade de suportar dificuldades sem se perturbar, mantendo a serenidade diante das adversidades e do tempo necessário para as coisas se realizarem.",
      practices: "Respirar profundamente antes de reagir; Observar a irritação sem agir impulsivamente; Lembrar que tudo tem seu tempo."
    },
    {
      name: "Ordem",
      description: "Disposição harmoniosa das coisas em seu devido lugar, tanto no mundo exterior quanto no interior.",
      practices: "Organizar espaço físico; Criar rotinas conscientes; Planejar o dia com antecedência."
    },
    {
      name: "Generosidade",
      description: "Dar livremente sem esperar retorno, compartilhar tempo, atenção, recursos e conhecimento com quem necessita.",
      practices: "Oferecer ajuda sem ser pedido; Compartilhar conhecimento; Doar tempo e atenção genuína."
    },
    {
      name: "Coragem",
      description: "Força interior para enfrentar o medo, agir corretamente mesmo sob pressão e defender princípios mesmo quando difícil.",
      practices: "Fazer o certo mesmo com medo; Falar a verdade com tato; Enfrentar desafios ao invés de evitá-los."
    },
    {
      name: "Temperança",
      description: "Moderação em todas as coisas, equilíbrio entre extremos, domínio sobre impulsos e desejos desmedidos.",
      practices: "Evitar excessos; Buscar o meio-termo; Dominar impulsos automáticos."
    },
    {
      name: "Honestidade",
      description: "Viver em consonância com a verdade, ser íntegro em palavras e ações.",
      practices: "Falar a verdade com compaixão; Reconhecer erros; Ser transparente nas intenções."
    },
    {
      name: "Humildade",
      description: "Reconhecer limitações sem falsa modéstia, estar aberto a aprender.",
      practices: "Ouvir mais que falar; Reconhecer que sempre há mais a aprender; Aceitar críticas construtivas."
    },
    {
      name: "Disciplina",
      description: "Capacidade de manter compromissos consigo mesmo.",
      practices: "Cumprir pequenos compromissos diários; Manter práticas mesmo sem vontade; Criar e seguir uma rotina."
    },
    {
      name: "Compaixão",
      description: "Sentir com o outro, compreender o sofrimento alheio.",
      practices: "Ver além das aparências; Oferecer presença empática; Perdoar falhas humanas."
    },
    {
      name: "Prudência",
      description: "Sabedoria prática para avaliar situações e tomar decisões ponderadas.",
      practices: "Pensar antes de agir; Considerar consequências; Buscar conselho quando necessário."
    },
    {
      name: "Justiça",
      description: "Dar a cada um o que lhe é devido, agir com equidade.",
      practices: "Tratar todos com equidade; Cumprir compromissos; Reconhecer méritos alheios."
    },
    {
      name: "Gratidão",
      description: "Reconhecer e valorizar o que se recebe.",
      practices: "Agradecer diariamente; Valorizar pequenas coisas; Expressar reconhecimento."
    },
    {
      name: "Serenidade",
      description: "Paz interior que não se abala com as circunstâncias externas.",
      practices: "Meditar regularmente; Não reagir automaticamente; Cultivar paz interior."
    },
    {
      name: "Diligência",
      description: "Aplicação cuidadosa e persistente no cumprimento de tarefas.",
      practices: "Fazer cada tarefa com atenção plena; Não deixar para depois; Completar o que começou."
    },
    {
      name: "Bondade",
      description: "Inclinação natural para o bem, agir com gentileza.",
      practices: "Fazer pequenos gestos gentis; Falar palavras encorajadoras; Agir com benevolência."
    },
    {
      name: "Sabedoria",
      description: "Conhecimento aplicado com discernimento.",
      practices: "Estudar filosofia; Refletir sobre experiências; Buscar compreensão profunda."
    },
    {
      name: "Fortaleza",
      description: "Resistência interior para perseverar em objetivos nobres.",
      practices: "Perseverar em objetivos; Manter-se firme em princípios; Não desistir facilmente."
    },
    {
      name: "Fraternidade",
      description: "Reconhecer a unidade essencial de todos os seres.",
      practices: "Ver a humanidade comum; Ajudar sem distinção; Cultivar sentimento de união."
    }
  ];

  const philosophicalQuotes = [
    { text: "Que ninguém hesite em se dedicar à filosofia enquanto jovem, nem se canse de fazê-lo depois de velho", author: "Epicuro" },
    { text: "Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis", author: "Sêneca" },
    { text: "A felicidade não consiste em adquirir e gozar, mas em não desejar nada", author: "Epicteto" },
    { text: "Conhece-te a ti mesmo e conhecerás o universo e os deuses", author: "Oráculo de Delfos" },
    { text: "O homem é feito pela sua crença. Como ele acredita, assim ele é", author: "Bhagavad Gita" },
    { text: "Não há religião superior à verdade", author: "H. P. Blavatsky" },
    { text: "A mente é tudo. O que você pensa, você se torna", author: "Buda" },
    { text: "O maior domínio é o domínio de si mesmo", author: "Sêneca" },
    { text: "A vida não examinada não vale a pena ser vivida", author: "Sócrates" }
  ];

  // Funções auxiliares
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const canDrawToday = () => {
    const today = getTodayKey();
    return lastDrawDate !== today;
  };

  // Sortear virtude (só uma vez por dia)
  const selectRandomVirtue = async () => {
    if (!canDrawToday()) {
      alert('Você já sorteou sua virtude hoje! Comprometa-se com ela até o fim do dia. 🎯');
      return;
    }

    const randomIndex = Math.floor(Math.random() * virtues.length);
    const selectedV = virtues[randomIndex].name;
    setSelectedVirtue(selectedV);
    setShowCustomVirtue(false);

    const today = getTodayKey();
    setLastDrawDate(today);

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastDrawDate: today
        });
      } catch (error) {
        console.log('Erro ao salvar data do sorteio');
      }
    }
  };

  // Monitorar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
        await loadTodayEntry(currentUser.uid);
        await loadAllEntries(currentUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Carregar dados do usuário
  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setTheme(data.theme || 'light');
        setLastDrawDate(data.lastDrawDate || null);
      } else {
        await setDoc(doc(db, 'users', uid), {
          createdAt: Timestamp.now(),
          theme: 'light',
          lastDrawDate: null
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Carregar entrada de hoje
  const loadTodayEntry = async (uid) => {
    try {
      const today = getTodayKey();
      const entryDoc = await getDoc(doc(db, 'entries', `${uid}_${today}`));
      if (entryDoc.exists()) {
        const data = entryDoc.data();
        setMorningDone(data.morningDone || false);
        setSelectedVirtue(data.virtue || '');
        setCustomVirtue(data.customVirtue || '');
        setDailyQuote(data.quote || null);
        setDailyIntention(data.intention || '');
        setEveningDone(data.eveningDone || false);
        setWhereIFailed(data.whereIFailed || '');
        setWhatIDidWell(data.whatIDidWell || '');
        setWhatILeftUndone(data.whatILeftUndone || '');
      } else {
        const randomQuote = philosophicalQuotes[Math.floor(Math.random() * philosophicalQuotes.length)];
        setDailyQuote(randomQuote);
      }
    } catch (error) {
      console.error('Erro ao carregar entrada:', error);
      const randomQuote = philosophicalQuotes[Math.floor(Math.random() * philosophicalQuotes.length)];
      setDailyQuote(randomQuote);
    }
  };

  // Carregar todas as entradas
  const loadAllEntries = async (uid) => {
    try {
      const q = query(
        collection(db, 'entries'),
        where('userId', '==', uid)
      );
      const querySnapshot = await getDocs(q);
      const loadedEntries = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.eveningDone) {
          loadedEntries.push({ id: doc.id, ...data });
        }
      });
      loadedEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
    }
  };

  // Salvar Prólogo
  const saveMorning = async () => {
    const finalVirtue = showCustomVirtue ? customVirtue : selectedVirtue;

    if (!finalVirtue.trim()) {
      alert('Por favor, selecione ou digite uma virtude para o dia.');
      return;
    }

    const todayKey = getTodayKey();
    const entry = {
      userId: user.uid,
      date: todayKey,
      morningDone: true,
      virtue: finalVirtue,
      customVirtue: showCustomVirtue ? customVirtue : '',
      quote: dailyQuote,
      intention: dailyIntention,
      morningTimestamp: Timestamp.now()
    };

    try {
      await setDoc(doc(db, 'entries', `${user.uid}_${todayKey}`), entry, { merge: true });
      setMorningDone(true);
      alert('✅ Prólogo salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar prólogo. Tente novamente.');
    }
  };

  // Salvar Epílogo
  const saveEvening = async () => {
    if (!whereIFailed.trim() || !whatIDidWell.trim() || !whatILeftUndone.trim()) {
      alert('Por favor, responda todas as três perguntas do exame noturno.');
      return;
    }

    const todayKey = getTodayKey();

    try {
      const entryRef = doc(db, 'entries', `${user.uid}_${todayKey}`);
      const existing = await getDoc(entryRef);

      const updatedEntry = {
        ...(existing.exists() ? existing.data() : {}),
        userId: user.uid,
        date: todayKey,
        eveningDone: true,
        whereIFailed,
        whatIDidWell,
        whatILeftUndone,
        eveningTimestamp: Timestamp.now()
      };

      await setDoc(entryRef, updatedEntry, { merge: true });
      setEveningDone(true);
      await loadAllEntries(user.uid);
      alert('✅ Epílogo salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar epílogo. Tente novamente.');
    }
  };

  // Deletar entrada
  const deleteEntry = async (dateKey) => {
    if (!window.confirm('Deseja realmente excluir este dia?')) return;

    try {
      await deleteDoc(doc(db, 'entries', `${user.uid}_${dateKey}`));
      setEntries(entries.filter(e => e.date !== dateKey));
    } catch (error) {
      alert('Erro ao excluir entrada.');
    }
  };

  // Exportar CSV
  const exportToCSV = () => {
    if (entries.length === 0) {
      alert('Não há entradas para exportar');
      return;
    }

    const headers = ['Data', 'Virtude', 'Compromisso', 'Onde Errei', 'O Que Fiz Bem', 'O Que Deixei de Fazer'];
    const rows = entries.map(entry => [
      entry.date,
      entry.virtue || '',
      entry.intention || '',
      entry.whereIFailed || '',
      entry.whatIDidWell || '',
      entry.whatILeftUndone || ''
    ]);

    let csvContent = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `diario-filosofico-${getTodayKey()}.csv`;
    link.click();
  };

  // Autenticação
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido');
      } else {
        setError('Erro ao autenticar. Tente novamente.');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('today');
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
    }
  };

  const filteredEntries = entries.filter(entry =>
    (entry.whereIFailed && entry.whereIFailed.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.whatIDidWell && entry.whatIDidWell.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.whatILeftUndone && entry.whatILeftUndone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.virtue && entry.virtue.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isDark = theme === 'dark';

  // O código continua... (devido ao limite de caracteres, vou dividir em partes)
  // Tela de Loading
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: isDark 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #f0e6d2 0%, #e8dcc4 100%)',
        color: isDark ? '#f0e6d2' : '#2c1810',
        fontFamily: 'Georgia, serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <BookOpen size={48} />
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de Login/Registro
  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0e6d2 0%, #e8dcc4 100%)',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <BookOpen size={48} color="#8b7355" style={{ margin: '0 auto' }} />
            <h1 style={{ 
              fontFamily: 'Georgia, serif',
              color: '#2c1810',
              marginTop: '1rem',
              fontSize: '1.8rem'
            }}>
              Diário Filosófico
            </h1>
            <p style={{ color: '#6b5744', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>
              "Examina tua vida diariamente"
            </p>
          </div>

          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1rem',
                border: '2px solid #8b7355',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'Georgia, serif'
              }}
            />

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '2px solid #8b7355',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'Georgia, serif'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                {showPassword ? <EyeOff size={20} color="#8b7355" /> : <Eye size={20} color="#8b7355" />}
              </button>
            </div>

            {error && (
              <div style={{ 
                background: '#fee', 
                color: '#c33', 
                padding: '0.75rem', 
                borderRadius: '8px',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                border: '1px solid #fcc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#8b7355',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '1rem',
                fontFamily: 'Georgia, serif',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#6b5744'}
              onMouseLeave={(e) => e.target.style.background = '#8b7355'}
            >
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: '#8b7355',
                border: '2px solid #8b7355',
                borderRadius: '8px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                transition: 'all 0.2s'
              }}
            >
              {isLogin ? 'Criar nova conta' : 'Já tenho conta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // App Principal
  return (
    <div style={{
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(135deg, #f0e6d2 0%, #e8dcc4 100%)',
      fontFamily: 'Georgia, serif',
      transition: 'background 0.3s ease'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        borderBottom: `2px solid ${isDark ? '#d4af37' : '#8b7355'}`,
        background: isDark ? 'rgba(26, 26, 46, 0.95)' : 'rgba(240, 230, 210, 0.95)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={32} color={isDark ? '#d4af37' : '#8b7355'} />
            <h1 style={{
              margin: 0,
              fontFamily: 'Georgia, serif',
              fontSize: '1.5rem',
              color: isDark ? '#f0e6d2' : '#2c1810',
              fontWeight: 700
            }}>
              Diário Filosófico
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setView('today')}
              style={{
                padding: '0.5rem 1rem',
                background: view === 'today' ? (isDark ? '#d4af37' : '#8b7355') : 'transparent',
                color: view === 'today' ? (isDark ? '#1a1a2e' : '#f0e6d2') : (isDark ? '#d4af37' : '#8b7355'),
                border: `2px solid ${isDark ? '#d4af37' : '#8b7355'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Hoje
            </button>

            <button
              onClick={() => setView('history')}
              style={{
                padding: '0.5rem 1rem',
                background: view === 'history' ? (isDark ? '#d4af37' : '#8b7355') : 'transparent',
                color: view === 'history' ? (isDark ? '#1a1a2e' : '#f0e6d2') : (isDark ? '#d4af37' : '#8b7355'),
                border: `2px solid ${isDark ? '#d4af37' : '#8b7355'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Histórico
            </button>

            <button
              onClick={toggleTheme}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: `2px solid ${isDark ? '#d4af37' : '#8b7355'}`,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isDark ? <Sun size={20} color="#d4af37" /> : <Moon size={20} color="#8b7355" />}
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                color: isDark ? '#d4af37' : '#8b7355',
                border: `2px solid ${isDark ? '#d4af37' : '#8b7355'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* VIEW: TODAY */}
        {view === 'today' && (
          <div>
            {/* Citação do Dia */}
            {dailyQuote && (
              <div style={{
                padding: '2rem',
                background: isDark 
                  ? 'rgba(212, 175, 55, 0.1)' 
                  : 'rgba(255, 245, 220, 0.6)',
                borderRadius: '16px',
                border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 115, 85, 0.3)'}`,
                marginBottom: '2rem'
              }}>
                <p style={{
                  fontSize: '1.2rem',
                  fontStyle: 'italic',
                  color: isDark ? '#f0e6d2' : '#2c1810',
                  marginBottom: '1rem',
                  lineHeight: '1.8'
                }}>
                  "{dailyQuote.text}"
                </p>
                <p style={{
                  fontSize: '1rem',
                  color: isDark ? '#b8a88a' : '#6b5744',
                  textAlign: 'right',
                  margin: 0
                }}>
                  — {dailyQuote.author}
                </p>
              </div>
            )}

            {/* PRÓLOGO */}
            <div style={{
              background: isDark ? 'rgba(26, 26, 46, 0.6)' : 'white',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 115, 85, 0.2)'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Sunrise size={28} color={isDark ? '#ffd966' : '#ff9800'} />
                <h2 style={{
                  margin: 0,
                  fontSize: '1.8rem',
                  color: isDark ? '#f0e6d2' : '#2c1810'
                }}>
                  Prólogo Matinal
                </h2>
              </div>

              {morningDone ? (
                <div style={{
                  padding: '1.5rem',
                  background: isDark ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9',
                  borderRadius: '12px',
                  border: `2px solid ${isDark ? 'rgba(76, 175, 80, 0.4)' : '#4caf50'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle size={24} color="#4caf50" />
                    <h3 style={{ margin: 0, color: isDark ? '#81c784' : '#2e7d32' }}>
                      Prólogo Completo!
                    </h3>
                  </div>
                  <p style={{ margin: '0.5rem 0', color: isDark ? '#c8e6c9' : '#1b5e20' }}>
                    <strong>Virtude do dia:</strong> {selectedVirtue || customVirtue}
                  </p>
                  {dailyIntention && (
                    <p style={{ margin: '0.5rem 0', color: isDark ? '#c8e6c9' : '#1b5e20' }}>
                      <strong>Compromisso:</strong> {dailyIntention}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {/* Seleção de Virtude */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: isDark ? '#f0e6d2' : '#2c1810'
                    }}>
                      Virtude do Dia:
                    </label>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={selectRandomVirtue}
                        disabled={!canDrawToday()}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: canDrawToday() 
                            ? (isDark ? '#d4af37' : '#8b7355')
                            : (isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 115, 85, 0.3)'),
                          color: canDrawToday() ? 'white' : (isDark ? '#888' : '#999'),
                          border: 'none',
                          borderRadius: '8px',
                          cursor: canDrawToday() ? 'pointer' : 'not-allowed',
                          fontFamily: 'Georgia, serif',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Shuffle size={18} />
                        {canDrawToday() ? 'Sortear Virtude' : 'Já sorteou hoje'}
                      </button>

                      <button
                        onClick={() => setShowCustomVirtue(!showCustomVirtue)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'transparent',
                          color: isDark ? '#d4af37' : '#8b7355',
                          border: `2px solid ${isDark ? '#d4af37' : '#8b7355'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontFamily: 'Georgia, serif',
                          fontWeight: 600
                        }}
                      >
                        {showCustomVirtue ? 'Escolher da Lista' : 'Escrever Própria Virtude'}
                      </button>
                    </div>

                    {showCustomVirtue ? (
                      <input
                        type="text"
                        placeholder="Digite sua virtude..."
                        value={customVirtue}
                        onChange={(e) => setCustomVirtue(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : '#8b7355'}`,
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: 'Georgia, serif',
                          background: isDark ? 'rgba(26, 26, 46, 0.8)' : 'white',
                          color: isDark ? '#f0e6d2' : '#2c1810'
                        }}
                      />
                    ) : (
                      <select
                        value={selectedVirtue}
                        onChange={(e) => setSelectedVirtue(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : '#8b7355'}`,
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: 'Georgia, serif',
                          background: isDark ? 'rgba(26, 26, 46, 0.8)' : 'white',
                          color: isDark ? '#f0e6d2' : '#2c1810'
                        }}
                      >
                        <option value="">Selecione uma virtude...</option>
                        {virtues.map((v, idx) => (
                          <option key={idx} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Descrição da Virtude Selecionada */}
                    {selectedVirtue && !showCustomVirtue && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 245, 220, 0.5)',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 115, 85, 0.3)'}`
                      }}>
                        <h4 style={{ 
                          margin: '0 0 0.5rem 0', 
                          color: isDark ? '#d4af37' : '#8b7355' 
                        }}>
                          {selectedVirtue}
                        </h4>
                        <p style={{ 
                          margin: '0.5rem 0', 
                          fontSize: '0.95rem',
                          color: isDark ? '#c8b896' : '#6b5744'
                        }}>
                          {virtues.find(v => v.name === selectedVirtue)?.description}
                        </p>
                        <p style={{ 
                          margin: '0.5rem 0 0 0', 
                          fontSize: '0.9rem',
                          color: isDark ? '#b8a88a' : '#8b7355',
                          fontStyle: 'italic'
                        }}>
                          <strong>Práticas:</strong> {virtues.find(v => v.name === selectedVirtue)?.practices}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Compromisso do Dia */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: isDark ? '#f0e6d2' : '#2c1810'
                    }}>
                      Meu compromisso para hoje:
                    </label>
                    <textarea
                      value={dailyIntention}
                      onChange={(e) => setDailyIntention(e.target.value)}
                      placeholder="Como vou praticar esta virtude hoje?"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : '#8b7355'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'Georgia, serif',
                        background: isDark ? 'rgba(26, 26, 46, 0.8)' : 'white',
                        color: isDark ? '#f0e6d2' : '#2c1810',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button
                    onClick={saveMorning}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: isDark ? '#d4af37' : '#8b7355',
                      color: isDark ? '#1a1a2e' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: 'Georgia, serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={20} />
                    Salvar Prólogo
                  </button>
                </div>
              )}
            </div>

            {/* EPÍLOGO */}
            <div style={{
              background: isDark ? 'rgba(26, 26, 46, 0.6)' : 'white',
              padding: '2rem',
              borderRadius: '16px',
              border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 115, 85, 0.2)'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Sunset size={28} color={isDark ? '#b19cd9' : '#9c27b0'} />
                <h2 style={{
                  margin: 0,
                  fontSize: '1.8rem',
                  color: isDark ? '#f0e6d2' : '#2c1810'
                }}>
                  Epílogo Noturno
                </h2>
              </div>

              {eveningDone ? (
                <div style={{
                  padding: '1.5rem',
                  background: isDark ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9',
                  borderRadius: '12px',
                  border: `2px solid ${isDark ? 'rgba(76, 175, 80, 0.4)' : '#4caf50'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle size={24} color="#4caf50" />
                    <h3 style={{ margin: 0, color: isDark ? '#81c784' : '#2e7d32' }}>
                      Epílogo Completo!
                    </h3>
                  </div>
                  <p style={{ color: isDark ? '#c8e6c9' : '#1b5e20' }}>
                    Exame noturno realizado. Descanse bem! 🌙
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{
                    marginBottom: '1.5rem',
                    color: isDark ? '#b8a88a' : '#6b5744',
                    fontStyle: 'italic'
                  }}>
                    "Que ninguém durma sem antes examinar as ações do dia" — Versos de Ouro de Pitágoras
                  </p>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: isDark ? '#f0e6d2' : '#2c1810'
                    }}>
                      1. Em que falhei hoje?
                    </label>
                    <textarea
                      value={whereIFailed}
                      onChange={(e) => setWhereIFailed(e.target.value)}
                      placeholder="Onde não agi conforme meus princípios?"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : '#8b7355'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'Georgia, serif',
                        background: isDark ? 'rgba(26, 26, 46, 0.8)' : 'white',
                        color: isDark ? '#f0e6d2' : '#2c1810',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: isDark ? '#f0e6d2' : '#2c1810'
                    }}>
                      2. O que fiz bem?
                    </label>
                    <textarea
                      value={whatIDidWell}
                      onChange={(e) => setWhatIDidWell(e.target.value)}
                      placeholder="Quais virtudes pratiquei?"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : '#8b7355'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'Georgia, serif',
                        background: isDark ? 'rgba(26, 26, 46, 0.8)' : 'white',
                        color: isDark ? '#f0e6d2' : '#2c1810',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: 600,
                      color: isDark ? '#f0e6d2' : '#2c1810'
                    }}>
                      3. O que deixei de fazer?
                    </label>
                    <textarea
                      value={whatILeftUndone}
                      onChange={(e) => setWhatILeftUndone(e.target.value)}
                      placeholder="O que poderia ter feito melhor?"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : '#8b7355'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'Georgia, serif',
                        background: isDark ? 'rgba(26, 26, 46, 0.8)' : 'white',
                        color: isDark ? '#f0e6d2' : '#2c1810',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button
                    onClick={saveEvening}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: isDark ? '#b19cd9' : '#9c27b0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: 'Georgia, serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={20} />
                    Salvar Epílogo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {view === 'history' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.8rem',
                color: isDark ? '#f0e6d2' : '#2c1810'
              }}>
                Histórico de Reflexões
              </h2>

              <button
                onClick={exportToCSV}
                disabled={entries.length === 0}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: entries.length > 0 ? (isDark ? '#d4af37' : '#8b7355') : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: entries.length > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'Georgia, serif',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Download size={18} />
                Exportar CSV
              </button>
            </div>

            {/* Busca */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={20} 
                  color={isDark ? '#d4af37' : '#8b7355'}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar nas reflexões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 3rem',
                    border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.5)' : '#8b7355'}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: 'Georgia, serif',
                    background: isDark ? 'rgba(26, 26, 46, 0.8)' : 'white',
                    color: isDark ? '#f0e6d2' : '#2c1810'
                  }}
                />
              </div>
            </div>

            {/* Lista de Entradas */}
            {filteredEntries.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                background: isDark ? 'rgba(26, 26, 46, 0.6)' : 'white',
                borderRadius: '16px',
                border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 115, 85, 0.2)'}`
              }}>
                <Calendar size={48} color={isDark ? '#d4af37' : '#8b7355'} style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: isDark ? '#b8a88a' : '#6b5744', fontSize: '1.1rem' }}>
                  {searchTerm ? 'Nenhuma entrada encontrada' : 'Nenhuma reflexão registrada ainda'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: isDark ? 'rgba(26, 26, 46, 0.6)' : 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: `2px solid ${isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(139, 115, 85, 0.2)'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div>
                        <h3 style={{
                          margin: 0,
                          color: isDark ? '#d4af37' : '#8b7355',
                          fontSize: '1.2rem'
                        }}>
                          {new Date(entry.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        {entry.virtue && (
                          <p style={{
                            margin: '0.25rem 0 0 0',
                            color: isDark ? '#b8a88a' : '#6b5744',
                            fontSize: '0.9rem'
                          }}>
                            Virtude: <strong>{entry.virtue}</strong>
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteEntry(entry.date)}
                        style={{
                          padding: '0.5rem',
                          background: 'transparent',
                          color: '#e74c3c',
                          border: '2px solid #e74c3c',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {entry.intention && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          margin: '0 0 0.5rem 0',
                          color: isDark ? '#f0e6d2' : '#2c1810',
                          fontSize: '1rem'
                        }}>
                          Compromisso:
                        </h4>
                        <p style={{
                          margin: 0,
                          color: isDark ? '#c8b896' : '#6b5744',
                          lineHeight: '1.6'
                        }}>
                          {entry.intention}
                        </p>
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        color: isDark ? '#f0e6d2' : '#2c1810',
                        fontSize: '1rem'
                      }}>
                        Em que falhei:
                      </h4>
                      <p style={{
                        margin: 0,
                        color: isDark ? '#c8b896' : '#6b5744',
                        lineHeight: '1.6'
                      }}>
                        {entry.whereIFailed}
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        color: isDark ? '#f0e6d2' : '#2c1810',
                        fontSize: '1rem'
                      }}>
                        O que fiz bem:
                      </h4>
                      <p style={{
                        margin: 0,
                        color: isDark ? '#c8b896' : '#6b5744',
                        lineHeight: '1.6'
                      }}>
                        {entry.whatIDidWell}
                      </p>
                    </div>

                    <div>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        color: isDark ? '#f0e6d2' : '#2c1810',
                        fontSize: '1rem'
                      }}>
                        O que deixei de fazer:
                      </h4>
                      <p style={{
                        margin: 0,
                        color: isDark ? '#c8b896' : '#6b5744',
                        lineHeight: '1.6'
                      }}>
                        {entry.whatILeftUndone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        color: isDark ? '#b8a88a' : '#6b5744',
        borderTop: `1px solid ${isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(139, 115, 85, 0.2)'}`,
        marginTop: '2rem'
      }}>
        <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic' }}>
          "Que ninguém durma sem antes examinar as ações do dia"
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
          Nova Acrópole · Filosofia à Maneira Clássica
        </p>
      </footer>
    </div>
  );
}

export default App;
