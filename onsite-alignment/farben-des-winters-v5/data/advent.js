/* Die Farben des Winters: Adventskalender, the 24 doors (DESIGN.md sections 8 and 9).
   Dates, door types and opening times are data, because none is confirmed yet: change them here.
   Works: the 18 best sellers on lumas.de by revenue (online, 27.10. to 25.11.2026), each orderable online in two sizes
   or more, written by _build/lineup_apply.py. ab = the shop's from-price: recheck with _build/check_schedule.py --online.
   voucher '' = the code follows. */
(function (root) {
  const ADVENT = {
    "config": {
      "content": "bestsellers",
      "discount": false,
      "orderDeadline": "2026-12-17",
      "artWeekend": "2026-12-04",
      "pdpBase": "https://www.lumas.de",
      "pageUrl": "https://www.lumas.de/lp/adventskalender/",
      "giftcardUrl": {
        "de": "https://www.lumas.de/geschenke/gutscheine/",
        "en": "https://www.lumas.de/en/gifts/gift-voucher/"
      },
      "newsletterUrl": "https://www.lumas.de/",
      "privacyUrl": {
        "de": "https://www.lumas.de/datenschutz/",
        "en": "https://www.lumas.de/en/privacy-policy/"
      },
      "notify": {
        "companyId": "S4rPDR",
        "listId": ""
      },
      "lineup": "lumas.de online revenue, 27.10. to 25.11.2026"
    },
    "days": [
      {
        "day": 1,
        "date": "2026-12-01",
        "type": "work",
        "world": "birch",
        "gesture": "snow",
        "opensAt": "00:00",
        "work": {
          "code": "mcs41",
          "sku": "MCS43",
          "artist": "Marta Contreras Simó",
          "title": "WINDA",
          "path": "/pictures/marta_contreras_simo/winda/",
          "ab": 499,
          "w": 400,
          "h": 400,
          "ed": 100,
          "year": 2023,
          "r": 1.0,
          "signed": true,
          "revenueRank": 1,
          "story": {
            "de": "Marta Contreras Simó aus Barcelona spezialisierte sich als Fotografin auf Street Style und Architektur, Menschen wagte sie nie zu fotografieren. Mit künstlicher Intelligenz erschafft sie heute Frauen mit prächtigen Hüten.",
            "en": "Marta Contreras Simó, from Barcelona, specialised in street style and architecture photography but never dared to photograph people. Today she uses artificial intelligence to create women in magnificent hats."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 2,
        "date": "2026-12-02",
        "type": "work",
        "world": "lake",
        "gesture": "frost",
        "opensAt": "00:00",
        "work": {
          "code": "csf10",
          "sku": "CSF12",
          "artist": "Carla Sá Fernandes",
          "title": "Oneness #30",
          "path": "/pictures/carla_sa_fernandes/oneness_30/",
          "ab": 449,
          "w": 450,
          "h": 600,
          "ed": 100,
          "year": 2026,
          "r": 0.75,
          "signed": true,
          "revenueRank": 7,
          "story": {
            "de": "Die Portugiesin Carla Sá Fernandes studierte zunächst Chemieingenieurwesen, bevor sie zur Kunst fand. In Fotografie, Malerei und digitaler Kunst macht sie das Unvorhersehbare zum Prinzip und tariert Farbe und Licht immer wieder neu aus.",
            "en": "Portuguese artist Carla Sá Fernandes studied chemical engineering before she found her way to art. In photography, painting and digital art she makes the unpredictable her principle, balancing colour and light anew each time."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 3,
        "date": "2026-12-03",
        "type": "work",
        "world": "mountain",
        "gesture": "paper",
        "opensAt": "00:00",
        "work": {
          "code": "ime109",
          "sku": "IME112",
          "artist": "Isabelle Menin",
          "title": "From a Dream 04",
          "path": "/pictures/isabelle_menin/from_a_dream_04/",
          "ab": 449,
          "w": 500,
          "h": 500,
          "ed": 150,
          "year": 2021,
          "r": 1.0,
          "signed": true,
          "revenueRank": 8,
          "story": {
            "de": "Isabelle Menin lebt in Brüssel und fotografiert jede Blüte einzeln, jede Anemone, jede Orchidee. Ihre geschichteten Collagen sind so detailreich, dass Computer nicht selten abzustürzen drohen.",
            "en": "Isabelle Menin lives in Brussels and photographs every flower on its own, each anemone, each orchid. Her layered collages hold so much detail that computers often threaten to crash."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 4,
        "date": "2026-12-04",
        "type": "work",
        "world": "village",
        "gesture": "lanterns",
        "opensAt": "00:00",
        "note": "artWeekend",
        "work": {
          "code": "mgi43",
          "sku": "MGI45",
          "artist": "Manu Grinspan",
          "title": "Catwoman",
          "path": "/pictures/manu_grinspan/catwoman/",
          "ab": 449,
          "w": 400,
          "h": 400,
          "ed": 100,
          "year": 2026,
          "r": 1.0,
          "signed": true,
          "revenueRank": 2,
          "story": {
            "de": "Jedes Werk von Manu Grinspan beginnt mit einer präzisen Bleistiftskizze, denn seine Wurzeln liegen im fotorealistischen Zeichnen. Erst dann bezieht er künstliche Intelligenz ein, und aus Kontrolle und Zufall entstehen Werke wie Standbilder aus einem unbekannten Film.",
            "en": "Every work by Manu Grinspan begins with a precise pencil sketch, since his roots lie in photorealistic drawing. Only then does he bring in artificial intelligence, and from control and chance come works like stills from an unknown film."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 5,
        "date": "2026-12-05",
        "type": "work",
        "world": "shore",
        "gesture": "ribbon",
        "opensAt": "00:00",
        "work": {
          "code": "nha02",
          "sku": "NHA04",
          "artist": "Niki Hare",
          "title": "The Right Place",
          "path": "/pictures/niki_hare/the_right_place/",
          "ab": 499,
          "w": 550,
          "h": 600,
          "ed": 150,
          "year": 2022,
          "r": 0.9171,
          "signed": true,
          "revenueRank": 9,
          "story": {
            "de": "Niki Hare lebt in Tewkesbury in England und arbeitete ihr Leben lang mit Pferden, bevor sie zu malen begann. Ihre Wortmalereien schreibt sie ungefiltert, so wie die Gedanken kommen, in Farbverläufen, in denen die Buchstaben zu schweben scheinen.",
            "en": "Niki Hare lives in Tewkesbury, England, and worked with horses all her life before she began to paint. She writes her word paintings unfiltered, just as the thoughts come, in colour gradients where the letters seem to float."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 6,
        "date": "2026-12-06",
        "type": "work",
        "world": "lake",
        "gesture": "candle",
        "opensAt": "00:00",
        "work": {
          "code": "cgo155",
          "sku": "CGO157",
          "artist": "Claudio Gotsch",
          "title": "Ying & Yang",
          "path": "/pictures/claudio_gotsch/ying_yang/",
          "ab": 999,
          "w": 860,
          "h": 600,
          "ed": 100,
          "year": 2025,
          "r": 1.4379,
          "signed": true,
          "revenueRank": 3,
          "story": {
            "de": "Claudio Gotsch, Fotograf aus dem Engadin, fotografiert seit seinem zehnten Lebensjahr Wildtiere. Für einen Adler im Landeanflug verbrachte er einmal fast eine Woche in einem Schneeloch.",
            "en": "Claudio Gotsch, a photographer from the Engadin, has photographed wildlife since the age of ten. To catch an eagle coming in to land, he once spent almost a week in a snow hole."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 7,
        "date": "2026-12-07",
        "type": "work",
        "world": "village",
        "gesture": "lanterns",
        "opensAt": "00:00",
        "work": {
          "code": "caa07",
          "sku": "CAA08",
          "artist": "Craig Alan",
          "title": "Stealing Millions",
          "path": "/pictures/craig_alan/stealing_millions/",
          "ab": 549,
          "w": 600,
          "h": 600,
          "ed": 100,
          "year": 2022,
          "r": 1.0,
          "signed": true,
          "revenueRank": 10,
          "story": {
            "de": "Die Idee kam Craig Alan auf einer Hochzeit, als er von oben sah, wie die Gäste gemeinsam die Form eines Auges bildeten. Seitdem setzt er Porträts aus winzigen Figuren zusammen, und jede einzelne hat ihr eigenes Gesicht.",
            "en": "The idea came to Craig Alan at a wedding, when he looked down and saw the guests forming the shape of an eye together. Since then he has built portraits from tiny figures, each with a face of its own."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 8,
        "date": "2026-12-08",
        "type": "work",
        "world": "birch",
        "gesture": "snow",
        "opensAt": "00:00",
        "work": {
          "code": "ime191",
          "sku": "IME191",
          "artist": "Isabelle Menin",
          "title": "Underwater Love 03",
          "path": "/pictures/isabelle_menin/underwater_love_03/",
          "ab": 950,
          "w": 720,
          "h": 900,
          "ed": 100,
          "year": 2026,
          "r": 0.8,
          "signed": true,
          "revenueRank": 11,
          "story": {
            "de": "Isabelle Menin lebt in Brüssel und fotografiert jede Blüte einzeln, jede Anemone, jede Orchidee. Ihre geschichteten Collagen sind so detailreich, dass Computer nicht selten abzustürzen drohen.",
            "en": "Isabelle Menin lives in Brussels and photographs every flower on its own, each anemone, each orchid. Her layered collages hold so much detail that computers often threaten to crash."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 9,
        "date": "2026-12-09",
        "type": "work",
        "world": "lake",
        "gesture": "frost",
        "opensAt": "00:00",
        "work": {
          "code": "mcs38",
          "sku": "MCS39",
          "artist": "Marta Contreras Simó",
          "title": "BO-RA",
          "path": "/pictures/marta_contreras_simo/bo-ra/",
          "ab": 449,
          "w": 400,
          "h": 400,
          "ed": 150,
          "year": 2023,
          "r": 1.0,
          "signed": true,
          "revenueRank": 12,
          "story": {
            "de": "Marta Contreras Simó aus Barcelona spezialisierte sich als Fotografin auf Street Style und Architektur, Menschen wagte sie nie zu fotografieren. Mit künstlicher Intelligenz erschafft sie heute Frauen mit prächtigen Hüten.",
            "en": "Marta Contreras Simó, from Barcelona, specialised in street style and architecture photography but never dared to photograph people. Today she uses artificial intelligence to create women in magnificent hats."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 10,
        "date": "2026-12-10",
        "type": "work",
        "world": "mountain",
        "gesture": "paper",
        "opensAt": "00:00",
        "work": {
          "code": "tst10",
          "sku": "TST12",
          "artist": "Tobias Stutz",
          "title": "Landscape room III",
          "path": "/pictures/tobias_stutz/landscape_room_iii/",
          "ab": 499,
          "w": 720,
          "h": 300,
          "ed": 150,
          "year": 2023,
          "r": 2.4014,
          "signed": true,
          "revenueRank": 13,
          "story": {
            "de": "Als Kind wollte der Maler Tobias Stutz Architekt werden. Heute findet er seine Motive in Architektur und Interiordesign, vor allem der Bauhaus-Ära, und die Ideen dazu oft auf dem Fahrrad zum Atelier.",
            "en": "As a child, painter Tobias Stutz wanted to become an architect. Today he finds his subjects in architecture and interior design, above all the Bauhaus era, and the ideas for them often on his bike ride to the studio."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 11,
        "date": "2026-12-11",
        "type": "work",
        "world": "shore",
        "gesture": "ribbon",
        "opensAt": "00:00",
        "work": {
          "code": "hli30",
          "sku": "HLI32",
          "artist": "Holger Lippmann",
          "title": "Tree IV",
          "path": "/pictures/holger_lippmann/tree_iv/",
          "ab": 799,
          "w": 950,
          "h": 500,
          "ed": 100,
          "year": 2011,
          "r": 1.8945,
          "signed": true,
          "revenueRank": 14,
          "story": {
            "de": "Holger Lippmann studierte Malerei und Bildhauerei in Dresden und Stuttgart und nennt seine Kunst heute E-Art. Seine Werke entstehen aus Algorithmen, die Farbe in kleine, rhythmische Strukturen zerlegen.",
            "en": "Holger Lippmann studied painting and sculpture in Dresden and Stuttgart and today calls his art e-art. His works grow from algorithms that break colour down into small, rhythmic structures."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 12,
        "date": "2026-12-12",
        "type": "work",
        "world": "village",
        "gesture": "lanterns",
        "opensAt": "00:00",
        "work": {
          "code": "nha30",
          "sku": "NHA32",
          "artist": "Niki Hare",
          "title": "Art is Freedom",
          "path": "/pictures/niki_hare/art_is_freedom/",
          "ab": 649,
          "w": 800,
          "h": 600,
          "ed": 150,
          "year": 2024,
          "r": 1.3333,
          "signed": true,
          "revenueRank": 15,
          "story": {
            "de": "Niki Hare lebt in Tewkesbury in England und arbeitete ihr Leben lang mit Pferden, bevor sie zu malen begann. Ihre Wortmalereien schreibt sie ungefiltert, so wie die Gedanken kommen, in Farbverläufen, in denen die Buchstaben zu schweben scheinen.",
            "en": "Niki Hare lives in Tewkesbury, England, and worked with horses all her life before she began to paint. She writes her word paintings unfiltered, just as the thoughts come, in colour gradients where the letters seem to float."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 13,
        "date": "2026-12-13",
        "type": "work",
        "world": "mountain",
        "gesture": "candle",
        "opensAt": "00:00",
        "work": {
          "code": "ylm19",
          "sku": "YLM21",
          "artist": "Ysabel Lemay",
          "title": "Garden of Life",
          "path": "/pictures/ysabel_lemay-3/garden_of_life/",
          "ab": 749,
          "w": 750,
          "h": 500,
          "ed": 150,
          "year": 2021,
          "r": 1.4403,
          "signed": true,
          "revenueRank": 4,
          "story": {
            "de": "Ysabel Lemay, geboren in Quebec, lebt in Texas. Für ihre Hypercollagen fügt sie hunderte Fotografien von ihren Expeditionen digital zusammen, Vogel für Vogel, Blüte für Blüte.",
            "en": "Ysabel Lemay, born in Quebec, lives in Texas. For her hypercollages she digitally assembles hundreds of photographs from her expeditions, bird by bird, blossom by blossom."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 14,
        "date": "2026-12-14",
        "type": "work",
        "world": "lake",
        "gesture": "frost",
        "opensAt": "00:00",
        "work": {
          "code": "wpa215",
          "sku": "WPA217",
          "artist": "Werner Pawlok",
          "title": "Ca' d'Oro VII",
          "path": "/pictures/werner_pawlok/ca_doro_vii/",
          "ab": 1190,
          "w": 980,
          "h": 500,
          "ed": 150,
          "year": 2021,
          "r": 1.9499,
          "signed": true,
          "revenueRank": 16,
          "story": {
            "de": "Werner Pawlok griff mit sechzehn zur Kamera, um 1969 sein Idol Jimi Hendrix auf der Bühne zu fotografieren. In Venedig erhielt der gebürtige Stuttgarter Zugang zu privaten Palazzi.",
            "en": "Werner Pawlok picked up a camera at sixteen to photograph his idol Jimi Hendrix on stage in 1969. In Venice, the Stuttgart-born photographer was given access to private palazzi."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 15,
        "date": "2026-12-15",
        "type": "work",
        "world": "birch",
        "gesture": "snow",
        "opensAt": "00:00",
        "work": {
          "code": "gua41",
          "sku": "GUA43",
          "artist": "Guachinarte",
          "title": "L.A. Nights",
          "path": "/pictures/guachinarte/la_nights/",
          "ab": 649,
          "w": 800,
          "h": 600,
          "ed": 150,
          "year": 2024,
          "r": 1.3333,
          "signed": true,
          "revenueRank": 17,
          "story": {
            "de": "Guachinarte holt die kalifornische Moderne in die Gegenwart: ikonische Architektur der Jahrhundertmitte, getaucht in Licht und Atmosphäre. In seinen Werken verschmelzen Natur und Architektur, und die Grenze zwischen innen und außen löst sich auf.",
            "en": "Guachinarte brings California modernism into the present: iconic mid-century architecture, steeped in light and atmosphere. In his works nature and architecture merge, and the line between inside and outside dissolves."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 16,
        "date": "2026-12-16",
        "type": "work",
        "world": "village",
        "gesture": "lanterns",
        "opensAt": "00:00",
        "work": {
          "code": "wuh63",
          "sku": "WUH64",
          "artist": "Wolfgang Uhlig",
          "title": "Saint-Raphaël",
          "path": "/pictures/wolfgang_uhlig/saint_raphael/",
          "ab": 499,
          "w": 900,
          "h": 300,
          "ed": 100,
          "year": 2018,
          "r": 3.0043,
          "signed": true,
          "revenueRank": 18,
          "story": {
            "de": "Der Frankfurter Fotograf Wolfgang Uhlig widmet sich immer wieder dem Meer. Auch in Saint-Raphaël bleibt der Blick frei, kein Schiff und kein Ufer stören den Horizont.",
            "en": "Frankfurt photographer Wolfgang Uhlig returns to the sea again and again. In Saint-Raphaël, too, the view stays open, with no ship and no shore to break the horizon."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 17,
        "date": "2026-12-17",
        "type": "work",
        "world": "mountain",
        "gesture": "paper",
        "opensAt": "00:00",
        "work": {
          "code": "htr01",
          "sku": "HTR05",
          "artist": "Hans Truöl",
          "title": "Flying Porsche",
          "path": "/pictures/hans_truoel/flying_porsche/",
          "ab": 899,
          "w": 900,
          "h": 670,
          "ed": 300,
          "year": 1960,
          "r": 1.3346,
          "signed": false,
          "revenueRank": 5,
          "story": {
            "de": "Hans Truöl war selbst Skifahrer und Bergsteiger, als er rund um Lech und Zürs zu fotografieren begann. Vor seiner Kamera standen Rennläufer wie Toni Sailer und Karl Schranz, und im Schnee seiner Schwarzweißfotografien wird die Landschaft zur reinen Fläche.",
            "en": "Hans Truöl was a skier and mountaineer himself when he began photographing around Lech and Zürs. Racers such as Toni Sailer and Karl Schranz stood before his camera, and in the snow of his black-and-white photographs the landscape becomes pure surface."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 18,
        "date": "2026-12-18",
        "type": "giftcard",
        "world": "shore",
        "gesture": "ribbon",
        "opensAt": "00:00",
        "image": "assets/giftcards/gutschein-sbn.webp",
        "r": 0.6977
      },
      {
        "day": 19,
        "date": "2026-12-19",
        "type": "giftcard",
        "world": "birch",
        "gesture": "snow",
        "opensAt": "00:00",
        "image": "assets/giftcards/gutschein-azi.webp",
        "r": 0.6977
      },
      {
        "day": 20,
        "date": "2026-12-20",
        "type": "work",
        "world": "lake",
        "gesture": "candle",
        "opensAt": "00:00",
        "work": {
          "code": "cgo15",
          "sku": "CGO16",
          "artist": "Claudio Gotsch",
          "title": "Bergwelt",
          "path": "/pictures/claudio_gotsch/bergwelt/",
          "ab": 1090,
          "w": 1050,
          "h": 700,
          "ed": 75,
          "year": 2013,
          "r": 1.5005,
          "signed": true,
          "revenueRank": 6,
          "story": {
            "de": "Claudio Gotsch, Fotograf aus dem Engadin, fotografiert seit seinem zehnten Lebensjahr Wildtiere. Für einen Adler im Landeanflug verbrachte er einmal fast eine Woche in einem Schneeloch.",
            "en": "Claudio Gotsch, a photographer from the Engadin, has photographed wildlife since the age of ten. To catch an eagle coming in to land, he once spent almost a week in a snow hole."
          }
        },
        "offerPct": 20,
        "voucher": ""
      },
      {
        "day": 21,
        "date": "2026-12-21",
        "type": "drop",
        "world": "shore",
        "gesture": "ribbon",
        "opensAt": "08:00",
        "earlyUntil": "2026-12-21T12:00",
        "endsAt": "2026-12-22T23:59",
        "ticket": "LUMAS-16650",
        "work": {
          "code": "rja63",
          "sku": "RJA63",
          "artist": "Robert Jahns",
          "title": "Penguins in Japan",
          "path": "/pictures/robert_jahns/penguins_in_japan/",
          "ab": 299,
          "w": 800,
          "h": 600,
          "ed": 400,
          "year": null,
          "r": 1.3333333333333333,
          "signed": true,
          "revenueRank": 19,
          "story": {
            "de": "",
            "en": ""
          }
        }
      },
      {
        "day": 22,
        "date": "2026-12-22",
        "type": "giftcard",
        "world": "lake",
        "gesture": "frost",
        "opensAt": "00:00",
        "image": "assets/giftcards/gutschein-msr.webp",
        "r": 0.6977
      },
      {
        "day": 23,
        "date": "2026-12-23",
        "type": "giftcard",
        "world": "mountain",
        "gesture": "paper",
        "opensAt": "00:00",
        "image": "assets/giftcards/gutschein-rja.webp",
        "r": 0.6977
      },
      {
        "day": 24,
        "date": "2026-12-24",
        "type": "finale",
        "world": "village",
        "opensAt": "00:00"
      }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = ADVENT;
  else root.GAL_ADVENT = ADVENT;
})(typeof window !== 'undefined' ? window : globalThis);
