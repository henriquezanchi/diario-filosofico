  import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sunrise, Sunset, Moon, Sun, LogOut, Shuffle, 
  Plus, X, Book, Download, Upload, Target, CheckCircle,
  Calendar, TrendingUp, Award, Eye, EyeOff, Menu, Home,
  History, BarChart3
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
  const [view, setView] = useState('home');
  const [theme, setTheme] = useState('light');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Estados do Prólogo
  const [morningDone, setMorningDone] = useState(false);
  const [selectedVirtue, setSelectedVirtue] = useState('');
  const [showVirtueDetail, setShowVirtueDetail] = useState(null);
  const [dailyIntention, setDailyIntention] = useState('');
  const [lastDrawDate, setLastDrawDate] = useState(null);
  const [dailyQuote, setDailyQuote] = useState(null);

  // Estados do Epílogo
  const [eveningDone, setEveningDone] = useState(false);
  const [didMorning, setDidMorning] = useState(true);
  const [whereIFailed, setWhereIFailed] = useState('');
  const [whatIDidWell, setWhatIDidWell] = useState('');
  const [whatILeftUndone, setWhatILeftUndone] = useState('');

  // Estados de Tarefas Personalizadas
  const [customTasks, setCustomTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [todayTasksStatus, setTodayTasksStatus] = useState({});

  // Estados de Metas de Longo Prazo
  const [yearGoals, setYearGoals] = useState('');
  const [lifeGoals, setLifeGoals] = useState('');

  // Estados de Histórico
  const [entries, setEntries] = useState([]);

  // Estados FV (oculto)
  const [fvUnlocked, setFvUnlocked] = useState(false);
  const [fvClickCount, setFvClickCount] = useState(0);

  // Virtudes com descrições
  const virtues = [
    {
      name: "Paciência",
      shortDesc: "Suportar dificuldades mantendo a serenidade",
      description: "A capacidade de suportar dificuldades sem se perturbar, mantendo a serenidade diante das adversidades e do tempo necessário para as coisas se realizarem.",
      practices: "• Respirar profundamente antes de reagir\n• Observar a irritação sem agir impulsivamente\n• Lembrar que tudo tem seu tempo",
      color: "#4A90E2"
    },
    {
      name: "Ordem",
      shortDesc: "Harmonia no mundo exterior e interior",
      description: "Disposição harmoniosa das coisas em seu devido lugar, tanto no mundo exterior quanto no interior.",
      practices: "• Organizar espaço físico diariamente\n• Criar rotinas conscientes\n• Planejar o dia com antecedência",
      color: "#7B68EE"
    },
    {
      name: "Generosidade",
      shortDesc: "Dar livremente sem esperar retorno",
      description: "Compartilhar tempo, atenção, recursos e conhecimento com quem necessita, sem expectativa de recompensa.",
      practices: "• Oferecer ajuda sem ser pedido\n• Compartilhar conhecimento\n• Doar tempo e atenção genuína",
      color: "#50C878"
    },
    {
      name: "Coragem",
      shortDesc: "Agir corretamente mesmo sob pressão",
      description: "Força interior para enfrentar o medo, agir corretamente mesmo sob pressão e defender princípios mesmo quando difícil.",
      practices: "• Fazer o certo mesmo com medo\n• Falar a verdade com tato\n• Enfrentar desafios ao invés de evitá-los",
      color: "#E74C3C"
    },
    {
      name: "Temperança",
      shortDesc: "Moderação e equilíbrio",
      description: "Moderação em todas as coisas, equilíbrio entre extremos, domínio sobre impulsos e desejos desmedidos.",
      practices: "• Evitar excessos em todas as áreas\n• Buscar o meio-termo\n• Dominar impulsos automáticos",
      color: "#9B59B6"
    },
    {
      name: "Honestidade",
      shortDesc: "Viver em consonância com a verdade",
      description: "Ser íntegro em palavras e ações, não enganar a si mesmo nem aos outros.",
      practices: "• Falar a verdade com compaixão\n• Reconhecer erros abertamente\n• Ser transparente nas intenções",
      color: "#3498DB"
    },
    {
      name: "Humildade",
      shortDesc: "Reconhecer limitações e estar aberto",
      description: "Reconhecer limitações sem falsa modéstia, estar aberto a aprender, não se colocar acima dos outros.",
      practices: "• Ouvir mais que falar\n• Reconhecer que sempre há mais a aprender\n• Aceitar críticas construtivas",
      color: "#95A5A6"
    },
    {
      name: "Disciplina",
      shortDesc: "Manter compromissos consigo mesmo",
      description: "Capacidade de seguir princípios escolhidos mesmo sem supervisão externa.",
      practices: "• Cumprir pequenos compromissos diários\n• Manter práticas mesmo sem vontade\n• Criar e seguir uma rotina",
      color: "#34495E"
    },
    {
      name: "Compaixão",
      shortDesc: "Sentir com o outro",
      description: "Compreender o sofrimento alheio e agir para aliviá-lo quando possível.",
      practices: "• Ver além das aparências\n• Oferecer presença empática\n• Perdoar falhas humanas",
      color: "#E67E22"
    },
    {
      name: "Prudência",
      shortDesc: "Sabedoria prática",
      description: "Avaliar situações, prever consequências e tomar decisões ponderadas.",
      practices: "• Pensar antes de agir\n• Considerar consequências\n• Buscar conselho quando necessário",
      color: "#16A085"
    },
    {
      name: "Justiça",
      shortDesc: "Dar a cada um o que lhe é devido",
      description: "Agir com equidade, respeitar direitos e cumprir deveres.",
      practices: "• Tratar todos com equidade\n• Cumprir compromissos assumidos\n• Reconhecer méritos alheios",
      color: "#C0392B"
    },
    {
      name: "Gratidão",
      shortDesc: "Reconhecer e valorizar",
      description: "Cultivar apreciação pelas bênçãos da vida.",
      practices: "• Agradecer diariamente por três coisas\n• Valorizar pequenas coisas\n• Expressar reconhecimento aos outros",
      color: "#F39C12"
    },
    {
      name: "Serenidade",
      shortDesc: "Paz interior",
      description: "Tranquilidade da mente e do coração independente das circunstâncias.",
      practices: "• Meditar regularmente\n• Não reagir automaticamente\n• Cultivar paz interior através da contemplação",
      color: "#1ABC9C"
    },
    {
      name: "Diligência",
      shortDesc: "Aplicação cuidadosa",
      description: "Fazer bem o que precisa ser feito, com atenção e dedicação.",
      practices: "• Fazer cada tarefa com atenção plena\n• Não deixar para depois\n• Completar o que começou",
      color: "#2ECC71"
    },
    {
      name: "Bondade",
      shortDesc: "Inclinação natural para o bem",
      description: "Agir com gentileza e benevolência em todas as circunstâncias.",
      practices: "• Fazer pequenos gestos gentis diariamente\n• Falar palavras encorajadoras\n• Agir com benevolência mesmo quando difícil",
      color: "#FF69B4"
    },
    {
      name: "Sabedoria",
      shortDesc: "Conhecimento com discernimento",
      description: "Compreensão profunda da vida e capacidade de ver a essência das coisas.",
      practices: "• Estudar filosofia regularmente\n• Refletir sobre experiências\n• Buscar compreensão profunda, não superficial",
      color: "#8E44AD"
    },
    {
      name: "Fortaleza",
      shortDesc: "Resistência interior",
      description: "Perseverar em objetivos nobres mesmo diante de dificuldades prolongadas.",
      practices: "• Perseverar em objetivos importantes\n• Manter-se firme em princípios\n• Não desistir facilmente",
      color: "#D35400"
    },
    {
      name: "Fraternidade",
      shortDesc: "Reconhecer a unidade",
      description: "Tratar os outros como irmãos na jornada humana.",
      practices: "• Ver a humanidade comum em todos\n• Ajudar sem distinção\n• Cultivar sentimento de união",
      color: "#27AE60"
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

  const handleLogoClick = () => {
    setFvClickCount(prev => prev + 1);
    if (fvClickCount >= 6) {
      setFvUnlocked(true);
      setFvClickCount(0);
      alert('🔓 Modo FV desbloqueado!');
    }
    setTimeout(() => setFvClickCount(0), 3000);
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
        await loadCustomTasks(currentUser.uid);
        await loadLongTermGoals(currentUser.uid);
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
        setFvUnlocked(data.fvUnlocked || false);
      } else {
        await setDoc(doc(db, 'users', uid), {
          createdAt: Timestamp.now(),
          theme: 'light',
          lastDrawDate: null,
          fvUnlocked: false
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
        setDailyIntention(data.intention || '');
        setEveningDone(data.eveningDone || false);
        setWhereIFailed(data.whereIFailed || '');
        setWhatIDidWell(data.whatIDidWell || '');
        setWhatILeftUndone(data.whatILeftUndone || '');
        setDidMorning(data.didMorning !== false);
        setDailyQuote(data.quote || null);
        setTodayTasksStatus(data.tasksStatus || {});
      }

      if (!dailyQuote) {
        const randomQuote = philosophicalQuotes[Math.floor(Math.random() * philosophicalQuotes.length)];
        setDailyQuote(randomQuote);
      }
    } catch (error) {
      console.error('Erro ao carregar entrada:', error);
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

  // Carregar tarefas personalizadas
  const loadCustomTasks = async (uid) => {
    try {
      const tasksDoc = await getDoc(doc(db, 'customTasks', uid));
      if (tasksDoc.exists()) {
        setCustomTasks(tasksDoc.data().tasks || []);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  // Carregar metas de longo prazo
  const loadLongTermGoals = async (uid) => {
    try {
      const goalsDoc = await getDoc(doc(db, 'longTermGoals', uid));
      if (goalsDoc.exists()) {
        const data = goalsDoc.data();
        setYearGoals(data.yearGoals || '');
        setLifeGoals(data.lifeGoals || '');
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    }
  };

  // Adicionar tarefa personalizada
  const addCustomTask = async () => {
    if (!newTaskName.trim()) return;

    const newTasks = [...customTasks, { id: Date.now(), name: newTaskName }];
    setCustomTasks(newTasks);
    setNewTaskName('');
    setShowAddTask(false);

    if (user) {
      await setDoc(doc(db, 'customTasks', user.uid), { tasks: newTasks });
    }
  };

  // Remover tarefa personalizada
  const removeCustomTask = async (taskId) => {
    const newTasks = customTasks.filter(t => t.id !== taskId);
    setCustomTasks(newTasks);

    if (user) {
      await setDoc(doc(db, 'customTasks', user.uid), { tasks: newTasks });
    }
  };

  // Marcar/desmarcar tarefa do dia
  const toggleTaskStatus = (taskId) => {
    setTodayTasksStatus(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Salvar Prólogo
  const saveMorning = async () => {
    if (!selectedVirtue.trim()) {
      alert('Por favor, selecione ou sorteie uma virtude para o dia.');
      return;
    }

    const todayKey = getTodayKey();
    const entry = {
      userId: user.uid,
      date: todayKey,
      morningDone: true,
      virtue: selectedVirtue,
      quote: dailyQuote,
      intention: dailyIntention,
      tasksStatus: todayTasksStatus,
      morningTimestamp: Timestamp.now()
    };

    try {
      await setDoc(doc(db, 'entries', `${user.uid}_${todayKey}`), entry, { merge: true });
      setMorningDone(true);
      alert('✅ Prólogo salvo com sucesso!');
      setView('home');
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
        didMorning,
        eveningTimestamp: Timestamp.now()
      };

      await setDoc(entryRef, updatedEntry, { merge: true });
      setEveningDone(true);
      await loadAllEntries(user.uid);
      alert('✅ Epílogo salvo com sucesso!');
      setView('home');
    } catch (error) {
      alert('Erro ao salvar epílogo. Tente novamente.');
    }
  };

  // Salvar metas de longo prazo
  const saveLongTermGoals = async () => {
    if (user) {
      try {
        await setDoc(doc(db, 'longTermGoals', user.uid), {
          yearGoals,
          lifeGoals,
          updatedAt: Timestamp.now()
        });
        alert('✅ Metas salvas com sucesso!');
      } catch (error) {
        alert('Erro ao salvar metas.');
      }
    }
  };

  // Exportar para CSV
  const exportToCSV = () => {
    if (entries.length === 0) {
      alert('Não há entradas para exportar');
      return;
    }

    const headers = ['Data', 'Fez Prólogo', 'Virtude', 'Compromisso', 'Onde Errei', 'O Que Fiz Bem', 'O Que Deixei de Fazer'];
    const rows = entries.map(entry => [
      entry.date,
      entry.didMorning ? 'Sim' : 'Não',
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
    setView('home');
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
    }
  };

  const isDark = theme === 'dark';

  // Tela de Loading
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#f0e6d2',
        fontFamily: 'Georgia, serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <BookOpen size={48} className="pulse" />
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
                border: '1px solid #fcc'
              }}>
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

 } // App Principal (continua no próximo comentário...)
