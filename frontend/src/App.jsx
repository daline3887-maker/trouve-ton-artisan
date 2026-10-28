import React,{useEffect,useState} from 'react';
import{Link,useParams,useSearchParams,Routes,Route,useNavigate}from'react-router-dom';

function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API}/api/categories`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error('Impossible de charger les catégories');
        }
        return response.json();
      })
      .then(data => setCategories(data.map(c => c.nom)))
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      });

    return () => controller.abort();
  }, []);

  return categories;
}

const API=import.meta.env.VITE_API_URL||'';
function useArtisans(query=''){const[data,setData]=useState([]),[error,setError]=useState('');useEffect(()=>{const ctrl=new AbortController();fetch(`${API}/api/artisans${query}`,{signal:ctrl.signal}).then(r=>{if(!r.ok)throw Error('Service indisponible');return r.json()}).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message)});return()=>ctrl.abort()},[query]);return[data,error]}
function Header(){
  const categories = useCategories();
  const [q,setQ] = useState('');
  const nav = useNavigate();return <header><div className="container"><div className="headtop"><Link to="/" aria-label="Accueil"><img className="logo" src="/logo.png" alt="Trouve ton artisan ! Avec la région Auvergne-Rhône-Alpes"/></Link><form role="search" onSubmit={e=>{e.preventDefault();nav('/artisans?search='+encodeURIComponent(q))}}><label className="visually-hidden" htmlFor="search">Rechercher un artisan</label><input id="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un artisan"/><button type="submit">Rechercher</button></form></div><nav aria-label="Catégories d'artisans"><ul>{categories.map(c=><li key={c}><Link to={'/artisans?categorie='+encodeURIComponent(c)}>{c}</Link></li>)}</ul></nav></div></header>}
function Footer(){return <footer><div className="container foot"><div><strong>Auvergne-Rhône-Alpes</strong><p>101 cours Charlemagne<br/>CS 20033<br/>69269 LYON CEDEX 02<br/>France<br/><a href="tel:+33426734000">+33 (0)4 26 73 40 00</a></p></div><nav aria-label="Informations légales"><strong>Informations</strong><ul>{['Mentions légales','Données personnelles','Accessibilité','Cookies'].map(x=><li key={x}><Link to={'/legal/'+encodeURIComponent(x)}>{x}</Link></li>)}</ul></nav></div></footer>}
function Stars({note}){return <span className="stars" aria-label={'Note : '+note+' sur 5'}>★ <b>{Number(note).toFixed(1)}/5</b></span>}
function ArtisanCard({a}){return <Link className="artisan-card" to={'/artisan/'+a.id}><div className="card-illustration" aria-hidden="true">{a.categorie==='Alimentation'?'🥖':a.categorie==='Bâtiment'?'🛠️':a.categorie==='Fabrication'?'🧵':'✂️'}</div><div className="card-body"><h3>{a.nom}</h3><Stars note={a.note}/><p>{a.specialite}</p><p>📍 {a.ville}</p><span className="see">Voir la fiche →</span></div></Link>}
function Home(){const[data,error]=useArtisans('?top=1');return <><section className="hero"><div className="container"><span className="eyebrow">Auvergne-Rhône-Alpes</span><h1>Le bon artisan, près de chez vous.</h1><p>Découvrez des professionnels de votre région et contactez-les simplement.</p><Link className="btn-main" to="/artisans">Trouver un artisan →</Link></div></section><section className="container section"><h2>Comment trouver mon artisan ?</h2><div className="steps">{['Choisir la catégorie d’artisanat dans le menu.','Choisir un artisan.','Le contacter via le formulaire de contact.','Une réponse sera apportée sous 48h.'].map((s,i)=><article key={s}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></article>)}</div></section><section className="container section"><h2>Les trois artisans du mois</h2>{error&&<p role="alert">{error}</p>}<div className="cards">{data.map(a=><ArtisanCard key={a.id} a={a}/>)}</div></section></>}
function ListPage(){const[params]=useSearchParams(),q=params.toString(),[data,error]=useArtisans(q?'?'+q:'');return <main className="container section"><h1>{params.get('categorie')||'Tous les artisans'}</h1><p>{params.get('search')?'Résultats pour « '+params.get('search')+' »':'Découvrez les artisans de la région.'}</p>{error&&<p role="alert">{error}</p>}{!error&&data.length===0&&<p>Aucun artisan trouvé.</p>}<div className="cards">{data.map(a=><ArtisanCard key={a.id} a={a}/>)}</div></main>}
function Detail(){const{id}=useParams(),[a,setA]=useState(null),[error,setError]=useState(''),[form,setForm]=useState({nom:'',email:'',objet:'',message:''}),[status,setStatus]=useState('');useEffect(()=>{fetch(`${API}/api/artisans/${encodeURIComponent(id)}`).then(r=>{if(!r.ok)throw Error('Artisan introuvable');return r.json()}).then(setA).catch(e=>setError(e.message))},[id]);async function submit(e){e.preventDefault();setStatus('Envoi en cours…');try{const r=await fetch(`${API}/api/artisans/${id}/contact`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const body=await r.json();if(!r.ok)throw Error(body.error||'Échec de l’envoi');setStatus('Votre message a été transmis.');setForm({nom:'',email:'',objet:'',message:''})}catch(e){setStatus(e.message)}}if(error)return <NotFound/>;if(!a)return <main className="container section">Chargement…</main>;return <main className="container section"><Link to="/artisans">← Retour aux artisans</Link><div className="detail"><section><div className="detail-art" aria-hidden="true">🛠️</div><h1>{a.nom}</h1><Stars note={a.note}/><p><strong>Spécialité :</strong> {a.specialite}</p><p><strong>Localisation :</strong> {a.ville}</p><h2>À propos</h2><p>{a.a_propos}</p>{a.site_web&&<a href={a.site_web} target="_blank" rel="noopener noreferrer">Site web de l’artisan ↗</a>}</section><section className="contact"><h2>Contacter cet artisan</h2><form onSubmit={submit}>{[['nom','Votre nom'],['email','Votre e-mail'],['objet','Objet']].map(([k,l])=><label key={k}>{l}<input required maxLength={k==='objet'?150:120} type={k==='email'?'email':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label>Votre message<textarea required minLength="10" maxLength="3000" rows="5" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label><button className="btn-main">Envoyer le message</button><p role="status" aria-live="polite">{status}</p></form></section></div></main>}
function NotFound(){return <main className="container section notfound"><div aria-hidden="true">🔎</div><h1>Page non trouvée</h1><p>La page que vous avez demandée n'existe pas.</p><Link className="btn-main" to="/">Retour à l'accueil</Link></main>}
function Legal(){const{type}=useParams();return <main className="container section"><h1>{decodeURIComponent(type)}</h1><p>Page en construction. Les informations officielles seront ajoutées par le responsable de la publication avant la mise en production.</p></main>}
export default function App(){return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/artisans" element={<ListPage/>}/><Route path="/artisan/:id" element={<Detail/>}/><Route path="/legal/:type" element={<Legal/>}/><Route path="*" element={<NotFound/>}/></Routes><Footer/></>}
