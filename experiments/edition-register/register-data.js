/* LUMAS Edition Register — MVP dataset
   Source: dwh.lumas_article_new (article master) + dwh.lumas_product (order ledger),
   retrieved 2026-07-03 via the LUMAS MCP beta. Records verbatim; no depletion data published.
   Row: [sku, artist, title, editionSize, mark, technique, surface, wMm, hMm,
         yearCreation, yearPublication, state, completionFigure, image, firstSale, lastSale]
   state: open | completed | retired | enquiry  (derived: completed = master 'Soldout'
   or recorded placements = edition size; retired = 'Discontinued'; enquiry = 'Please Call')
   completionFigure: edition size when every copy is recorded placed, else null. */
const RAW = [
  /* Edward Steichen — Condé Nast archive editions, published 2015 */
  ['CNA01','Edward Steichen','Gloria Swanson',150,'archivstempel','Black and white photo print','glossy',770,1000,'1924','2015','open',null,'cna01','2015-02','2017-12'],
  ['CNA02','Edward Steichen','Gloria Swanson',150,'archivstempel','Black and white photo print','glossy',540,700,'1924','2015','open',null,'cna01','2015-02','2017-04'],
  ['CNA03','Edward Steichen','Gloria Swanson',250,'archivstempel','Black and white photo print','glossy',310,400,'1924','2015','open',null,'cna01','2015-03','2017-12'],
  ['CNA07','Edward Steichen','The Grand Piano',150,'archivstempel','Black and white photo print','glossy',790,1000,'1935','2015','open',null,'cna07','2015-04','2017-11'],
  ['CNA08','Edward Steichen','The Grand Piano',150,'archivstempel','Black and white photo print','glossy',550,700,'1935','2015','open',null,'cna07','2015-02','2017-11'],
  ['CNA09','Edward Steichen','The Grand Piano',250,'archivstempel','Black and white photo print','glossy',320,400,'1935','2015','open',null,'cna07','2015-03','2017-11'],
  /* Edward Steichen — silver gelatine editions, published 1982–1987 */
  ['EST01','Edward Steichen','Alfred Stieglitz',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',195,245,'1915','1984','enquiry',null,'est01','2015-12','2018-02'],
  ['EST02','Edward Steichen','Avocados',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',334,267,'1930','1982','retired',null,'est02','2007-09','2007-11'],
  ['EST03','Edward Steichen','Brancusi',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',266,340,'1927','1982','retired',null,'est03','2007-09','2014-02'],
  ['EST04','Edward Steichen','Carl Sandburg',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',343,238,'1930','1982','retired',null,'est04','2014-06','2017-06'],
  ['EST05','Edward Steichen','Charlie Chaplin',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',267,338,'1925','1982','retired',null,'est05','2007-08','2017-02'],
  ['EST06','Edward Steichen','Empire State Building',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',264,327,'1932','1982','retired',null,'est06','2007-11','2013-01'],
  ['EST07','Edward Steichen','Elisabeth Meyer',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',188,240,'1921','1982','retired',null,'est07','2007-11','2013-10'],
  ['EST08','Edward Steichen','Evening Primroses',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',332,263,'1928','1982','retired',null,'est08','2007-11','2013-02'],
  ['EST09','Edward Steichen','Foxgloves',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',264,330,'1926','1982','retired',null,'est09','2008-07','2012-07'],
  ['EST10','Edward Steichen','Gary Cooper',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',267,331,'1930','1982','retired',null,'est10','2007-10','2008-06'],
  ['EST11','Edward Steichen','Greta Garbo',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,337,'1928','1982','retired',null,'est11','2007-09','2010-01'],
  ['EST12','Edward Steichen','Homeless Women',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,332,'1932','1982','enquiry',null,'est12','2012-11','2018-02'],
  ['EST13','Edward Steichen','Improvisation: George Washington',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',187,234,'1925','1982','enquiry',null,'est13','2011-02','2020-06'],
  ['EST14','Edward Steichen','J. P. Morgan',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',266,332,'1903','1982','retired',null,'est14','2008-03','2012-05'],
  ['EST15','Edward Steichen','Laughing Boxes',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',190,240,'1922','1982','retired',null,'est15','2013-06','2014-12'],
  ['EST16','Edward Steichen','Lillian Gish',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',266,338,'1934','1982','retired',null,'est16','2013-09','2015-03'],
  ['EST17','Edward Steichen','Marlene Dietrich',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',190,237,'1931','1982','retired',null,'est17','2007-10','2010-06'],
  ['EST18','Edward Steichen','Lotus',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,333,'1915','1982','retired',null,'est18','2007-10','2007-12'],
  ['EST19','Edward Steichen','Nude with Lilacs',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',190,238,'1936','1982','retired',null,'est19','2007-10','2015-02'],
  ['EST20','Edward Steichen','Paul Robeson',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,332,'1933','1982','retired',null,'est20','2017-02','2017-08'],
  ['EST21','Edward Steichen','Sunday Night, 40th Street',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',267,332,'1925','1982','retired',null,'est21','2007-09','2009-06'],
  ['EST22','Edward Steichen','Self Portrait',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',268,329,'1917','1982','retired',null,'est22','2007-11','2012-02'],
  ['EST23','Edward Steichen','Three Apples',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',331,265,'1921','1982','retired',null,'est23','2015-06','2015-08'],
  ['EST24','Edward Steichen','Wheelbarrow',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',241,190,'1920','1982','retired',null,'est24','2012-02','2012-09'],
  ['EST25','Edward Steichen','Venerable Tree Trunk',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,329,'1932','1982','retired',null,'est25','2008-12','2014-05'],
  ['EST26','Edward Steichen','Carl Sandburg',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',263,325,'1930','1987','retired',null,'est26','2007-09','2009-07'],
  ['EST27','Edward Steichen','Agnes Meyer',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',191,241,'undated','1987','retired',null,'est27','2012-07','2017-06'],
  ['EST28','Edward Steichen','Apple Blossoms',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',262,332,'undated','1987','retired',null,'est28','2007-10','2011-03'],
  ['EST29','Edward Steichen','Birch Tree',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',268,330,'1934','1987','retired',null,'est29','2009-09','2017-08'],
  ['EST30','Edward Steichen','Brancusi',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',268,330,'1922','1987','enquiry',null,'est30','2007-11','2017-03'],
  ['EST31','Edward Steichen','Bryant Park Breadline',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,336,'1933','1987','retired',null,'est31','2007-09','2013-02'],
  ['EST32','Edward Steichen','Clouds',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',340,235,'undated','1987','retired',null,'est32','2007-10','2007-10'],
  ['EST33','Edward Steichen','E. Gordon Craig',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',263,333,'1920','1987','enquiry',null,'est33','2014-12','2018-06'],
  ['EST34','Edward Steichen','Fanny Wickes',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',188,236,'1924','1987','retired',null,'est34','2011-06','2013-12'],
  ['EST35','Edward Steichen','George Washington Bridge',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',264,333,'1931','1987','retired',null,'est35','2007-09','2013-02'],
  ['EST36','Edward Steichen','Nude',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',263,338,'1933','1987','retired',null,'est36','2007-11','2012-12'],
  ['EST37','Edward Steichen','The Blue Sky',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',184,240,'1923','1987','retired',null,'est37','2007-09','2016-02'],
  ['EST38','Edward Steichen','Anne Harding',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,335,'1931','1986','retired',null,'est38','2010-01','2012-08'],
  ['EST39','Edward Steichen','Florida Jungle',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',337,264,'1936','1986','retired',null,'est39','2007-11','2019-02'],
  ['EST40','Edward Steichen','Frost in Rambler Roses',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',333,263,'1920','1986','retired',null,'est40','2008-02','2009-01'],
  ['EST41','Edward Steichen','Gorham Silver',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',263,335,'1930','1986','retired',null,'est41','2007-12','2008-04'],
  ['EST42','Edward Steichen','Life Mask of Abraham Lincoln',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,338,'1935','1986','enquiry',null,'est42','2007-12','2009-01'],
  ['EST43','Edward Steichen','Lotus Pond',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',332,265,'1935','1986','retired',null,'est43','2007-12','2010-08'],
  ['EST44','Edward Steichen','Colette',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,335,'1935','1986','retired',null,'est44','2012-08','2017-08'],
  ['EST45','Edward Steichen','Conradt Veidt & Lupe Velez',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',268,335,'1928','1986','retired',null,'est45','2009-04','2014-02'],
  ['EST46','Edward Steichen','Dana Miller in the Pond',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',189,239,'1954','1986','retired',null,'est46','2007-09','2012-07'],
  ['EST47','Edward Steichen','Matches and Match Boxes',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',189,235,'1926','1986','retired',null,'est47','2007-10','2013-02'],
  ['EST48','Edward Steichen','Merle Oberon',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',269,334,'1935','1986','retired',null,'est48','2007-11','2010-01'],
  ['EST49','Edward Steichen','Sunflower',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',333,267,'1920','1986','retired',null,'est49','2007-09','2015-04'],
  ['EST50','Edward Steichen','Elisabeth Bergner',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',190,237,'1935','1984','retired',null,'est50','2008-06','2014-02'],
  ['EST51','Edward Steichen','Eugene O’Neill',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,331,'1932','1984','retired',null,'est51','2008-04','2017-03'],
  ['EST52','Edward Steichen','Gloria Swanson',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',263,332,'1927','1984','enquiry',null,'est52','2010-01','2018-06'],
  ['EST53','Edward Steichen','Greta Garbo',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',263,335,'1928','1984','retired',null,'est53','2007-09','2012-03'],
  ['EST54','Edward Steichen','Joan Crawford',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',243,338,'1932','1984','retired',null,'est54','2007-11','2012-05'],
  ['EST55','Edward Steichen','Leslie Howard',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',190,235,'1932','1984','retired',null,'est55','2007-11','2008-05'],
  ['EST56','Edward Steichen','Lunt & Fontanne',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',267,340,'1932','1984','retired',null,'est56','2008-03','2013-09'],
  ['EST57','Edward Steichen','Marion Morehouse',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',266,335,'1927','1984','retired',null,'est57','2007-11','2008-05'],
  ['EST58','Edward Steichen','Marlene Dietrich',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',263,337,'1932','1984','retired',null,'est58','2007-10','2012-05'],
  ['EST59','Edward Steichen','Noel Coward',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,332,'1932','1984','retired',null,'est59','2007-10','2008-01'],
  ['EST60','Edward Steichen','Rudolf Valentino',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',265,338,'1924','1984','retired',null,'est60','2007-10','2008-06'],
  ['EST61','Edward Steichen','Self Portrait',100,'signatur','Silver gelatine print, mounted on approx. 20 × 16 inch artboard','matte',238,333,'1929','1984','retired',null,'est61','2007-11','2008-12'],
  /* Horst P. Horst — Condé Nast archive editions, published 2014–2015 */
  ['CNA25','Horst P. Horst','The Mainbocher Corset',150,'archivstempel','PE coated paper','glossy',790,1000,'1939','2014','open',null,'cna25','2014-10','2019-03'],
  ['CNA26','Horst P. Horst','The Mainbocher Corset',150,'archivstempel','PE coated paper','glossy',550,700,'1939','2014','open',null,'cna25','2014-10','2019-04'],
  ['CNA27','Horst P. Horst','The Mainbocher Corset',250,'archivstempel','PE coated paper','glossy',310,400,'1939','2014','open',null,'cna25','2014-10','2019-04'],
  ['CNA28','Horst P. Horst','Lisa with Harp',150,'archivstempel','PE coated paper','glossy',790,1000,'1939','2014','open',null,'cna28','2015-10','2016-12'],
  ['CNA29','Horst P. Horst','Lisa with Harp',150,'archivstempel','PE coated paper','glossy',550,700,'1939','2014','open',null,'cna28','2015-09','2017-02'],
  ['CNA30','Horst P. Horst','Lisa with Harp',250,'archivstempel','PE coated paper','glossy',320,400,'1939','2014','open',null,'cna28','2014-11','2017-04'],
  ['CNA31','Horst P. Horst','Barefoot Beauty',150,'archivstempel','PE coated paper','glossy',780,1000,'1941','2014','open',null,'cna31','2016-05','2016-05'],
  ['CNA32','Horst P. Horst','Barefoot Beauty',150,'archivstempel','PE coated paper','glossy',540,700,'1941','2014','open',null,'cna31','2014-11','2017-06'],
  ['CNA33','Horst P. Horst','Barefoot Beauty',250,'archivstempel','PE coated paper','glossy',310,400,'1941','2014','open',null,'cna31','2014-11','2017-06'],
  ['CNA34','Horst P. Horst','Callas',150,'archivstempel','PE coated paper','glossy',940,1000,'1989','2014','open',null,'cna34',null,null],
  ['CNA35','Horst P. Horst','Callas',150,'archivstempel','PE coated paper','glossy',660,700,'1989','2014','open',null,'cna34',null,null],
  ['CNA36','Horst P. Horst','Callas',250,'archivstempel','PE coated paper','glossy',380,400,'1989','2014','open',null,'cna34','2014-12','2017-03'],
  ['CNA37','Horst P. Horst','Nude with Callas',150,'archivstempel','PE coated paper','glossy',830,1000,'1989','2014','open',null,'cna37','2015-04','2017-01'],
  ['CNA38','Horst P. Horst','Nude with Callas',150,'archivstempel','PE coated paper','glossy',580,700,'1989','2014','open',null,'cna37','2015-05','2017-06'],
  ['CNA39','Horst P. Horst','Nude with Callas',250,'archivstempel','PE coated paper','glossy',330,400,'1989','2014','open',null,'cna37','2014-11','2017-06'],
  ['CNA42','Horst P. Horst','Coco Chanel',250,'archivstempel','Pigment print on Hahnemühle Pearl','glossy',400,400,'1954','2015','open',null,'cna42','2015-02','2017-10'],
  ['CNA43','Horst P. Horst','What’s New?',150,'archivstempel','Lambda colour photograph','glossy',790,1000,'1943','2014','open',null,'cna43','2014-10','2017-05'],
  ['CNA44','Horst P. Horst','What’s New?',150,'archivstempel','Lambda colour photograph','glossy',550,700,'1943','2014','open',null,'cna43','2014-12','2017-10'],
  ['CNA45','Horst P. Horst','What’s New?',250,'archivstempel','Lambda colour photograph','glossy',320,400,'1943','2014','open',null,'cna43','2014-11','2017-08'],
  ['CNA46','Horst P. Horst','Profile',150,'archivstempel','Lambda colour photograph','glossy',790,1000,'1944','2014','open',null,'cna46','2015-08','2017-05'],
  ['CNA47','Horst P. Horst','Profile',150,'archivstempel','Lambda colour photograph','glossy',550,700,'1944','2014','open',null,'cna46','2014-12','2017-02'],
  ['CNA48','Horst P. Horst','Profile',250,'archivstempel','Lambda colour photograph','glossy',320,400,'1944','2014','open',null,'cna46','2015-01','2017-10'],
  ['CNA49','Horst P. Horst','Balance',150,'archivstempel','Lambda colour photograph','glossy',800,1000,'1941','2014','open',null,'cna49','2014-10','2019-04'],
  ['CNA50','Horst P. Horst','Balance',150,'archivstempel','Lambda colour photograph','glossy',560,700,'1941','2014','completed',150,'cna49','2014-10','2019-02'],
  ['CNA51','Horst P. Horst','Balance',250,'archivstempel','Lambda colour photograph','glossy',320,400,'1941','2014','completed',250,'cna49','2014-10','2018-12'],
  ['CNA64','Horst P. Horst','The Women',150,'archivstempel','PE coated paper','glossy',730,1000,'1934','2014','open',null,'cna64','2016-01','2016-12'],
  ['CNA65','Horst P. Horst','The Women',150,'archivstempel','PE coated paper','glossy',510,700,'1934','2014','open',null,'cna64','2014-11','2016-02'],
  ['CNA66','Horst P. Horst','The Women',250,'archivstempel','PE coated paper','glossy',290,400,'1934','2014','open',null,'cna64','2014-10','2017-03'],
  /* Recently closed editions */
  ['GVE04','Gavin Evans','Lazarus LVII',150,'signatur','Lenticular','glossy',600,600,'2018','2018','completed',150,'gve03','2018-12','2026-02'],
  ['RJA04','Robert Jahns','NYC Penguins',500,'signatur','Lambda colour photograph','matte',810,900,'2017','2018','completed',500,'rja04','2018-10','2019-01'],
  ['SBN02','Soo Burnell','Day Dreaming at the Summer Pool',150,'signatur','Lambda colour photograph','matte',860,600,'2019','2020','completed',null,'sbn01','2020-05','2026-02'],
  /* Open editions */
  ['IME97','Isabelle Menin','Only In Your Heart 03',150,'signatur','Lambda colour photograph','glossy',2400,1200,'2021','2021','open',null,'ime97','2024-01','2026-07'],
  ['IME98','Isabelle Menin','Only In Your Heart 03',150,'signatur','Lambda colour photograph','glossy',1800,900,'2021','2021','open',null,'ime97','2023-11','2026-07'],
  ['IME99','Isabelle Menin','Only In Your Heart 03',150,'signatur','Lambda colour photograph','glossy',1200,600,'2021','2021','open',null,'ime97','2023-11','2026-07'],
  ['IME100','Isabelle Menin','Only In Your Heart 03',150,'signatur','Lambda colour photograph','glossy',900,450,'2021','2021','open',null,'ime97','2022-09','2026-06'],
  ['NHA01','Niki Hare','What Is Real and What Is Not',500,'signatur','Lambda colour photograph','glossy',900,600,'2022','2022','open',null,'nha01','2022-07','2025-01'],
];

const MARKS = {
  signatur: 'Hand-signed',
  archivstempel: 'Archive-stamped',
  studiostempel: 'Studio-stamped',
  nachlassstempel: 'Estate-stamped',
  echtheitszertifikat: 'Certificate of authenticity',
};

const STATES = {
  open: 'In the edition',
  completed: 'Edition completed',
  retired: 'Edition retired',
  enquiry: 'Archive record',
};

function slugify(s) {
  return s.toLowerCase().replace(/[’'.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function deriveAll() {
  const rows = RAW.map((r) => ({
    sku: r[0], artist: r[1], title: r[2], editionSize: r[3], markKey: r[4],
    mark: MARKS[r[4]] || r[4], technique: r[5], surface: r[6], widthMm: r[7], heightMm: r[8],
    yearCreation: r[9], yearPublication: r[10], state: r[11], stateLabel: STATES[r[11]],
    completionFigure: r[12], image: r[13], firstRecordedSale: r[14], lastRecordedSale: r[15],
    artistSlug: slugify(r[1]),
  }));
  rows.sort((a, b) => (a.yearPublication + a.sku).localeCompare(b.yearPublication + b.sku));
  rows.forEach((e, i) => { e.registerId = 'LER-' + String(i + 1).padStart(4, '0'); });
  return rows;
}

if (typeof module !== 'undefined') module.exports = { RAW, MARKS, STATES, deriveAll };
else window.REGISTER = deriveAll();
