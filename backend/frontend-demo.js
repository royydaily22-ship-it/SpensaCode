/*
Demo frontend (sekadar contoh bagaimana konek absensi/rekap dari token JWT).
Jalankan di browser console dari file HTML kamu.
*/

async function apiLogin(username, password){
  const res = await fetch('http://localhost:3000/api/auth/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({username, password})
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data?.message || 'login failed');
  return data;
}

async function apiMe(token){
  const res = await fetch('http://localhost:3000/api/me',{
    headers:{Authorization:'Bearer '+token}
  });
  return res.json();
}

async function adminRekap(token){
  const res = await fetch('http://localhost:3000/api/admin/absensi',{
    headers:{Authorization:'Bearer '+token}
  });
  return res.json();
}

async function siswaAbsensi(token){
  const res = await fetch('http://localhost:3000/api/siswa/absensi',{
    headers:{Authorization:'Bearer '+token}
  });
  return res.json();
}

(async ()=>{
  // contoh admin
  const {token, user} = await apiLogin('admin','12345');
  console.log('login ok', user);
  console.log('me', await apiMe(token));
  console.log('admin rekap', await adminRekap(token));

  // contoh siswa
  const s = await apiLogin('siswa','12345');
  console.log('siswa absensi', await siswaAbsensi(s.token));
})();
