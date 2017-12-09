const wanakana = require('wanakana');

const FADE_TIME = 600;

function startApp() {
  watchSubmit();
}

function watchSubmit() {
  $('.js-search-form').submit(event => {
    event.preventDefault();
    $('.js-results').html('');
    let englishWord = $(event.currentTarget)
      .find('.js-query')
      .val();
    getWordFromApi(englishWord, processDataFromWordApi);
    // highlight word instead of clearing it on search?
    $(event.currentTarget)
      .find('.js-query')
      .val('');
  });
}

function getWordFromApi(searchTerm, callback) {
  const query = {
    url:
      'https://jeff-cors-anywhere-nzumhvclct.now.sh/http://beta.jisho.org/api/v1/search/words',
    success: callback,
    data: {
      keyword: searchTerm
    }
  };
  $.ajax(query);
}

function processDataFromWordApi(data) {
  $('.results').fadeIn(FADE_TIME);
  processWordData(data.data);
}

function processWordData(wordArray) {
  let currentWordArray = wordArray;
  let wordsToDisplay = [];
  if (wordArray.length <= 5) {
    wordsToDisplay = currentWordArray;
    let kanjiArray = wordsToDisplay.map((word, index) => {
      return identifyKanji(word);
    });
    let kanjiArrayWithLocation = addKanjiLocation(kanjiArray);
    console.log(kanjiArrayWithLocation);
    let kanjiPromiseArray = kanjiArrayWithLocation.map(kanjiObj =>
      getKanjiInfoFromApi(kanjiObj.kanji)
    );
    Promise.all(kanjiPromiseArray).then((...args) => {
      console.log(args);
      for (let i = 0; i < args.length; i++) {
        const kanjiData = args[i];
        const location = kanjiArrayWithLocation[i];
      }
    });
    // pull in kanji api data with indexes
    let kanjiInfo = 'data from apis';
    // pass them to display function so it can display info
    displayWordData(wordsToDisplay, kanjiInfo);
  } else {
    wordsToDisplay = currentWordArray.splice(0, 5);

    let kanjiInfo = 'data from apis';
    displayWordData(wordsToDisplay, kanjiInfo);
    // execute listener to load more results on scroll down
    // pageScrollListener(currentWordArray)
  }
}

function identifyKanji(word) {
  if (typeof word.japanese[0].word === 'undefined') return [''];
  let wordCharacters = word.japanese[0].word.split('');
  let kanjiInWord = wordCharacters.filter((char, index) => {
    return (
      (char >= '\u4e00' && char <= '\u9faf') ||
      (char >= '\u3400' && char <= '\u4dbf')
    );
  });
  return kanjiInWord;
}

function addKanjiLocation(kanjiArray) {
  let kanjiArrayWithLocation = [];
  let kanjiCounter = 0;
  kanjiArray.forEach((kanjiInWord, wordIndex) => {
    kanjiInWord.forEach((kanji, kanjiIndex) => {
      kanjiArrayWithLocation[kanjiCounter] = {
        kanji: kanji,
        location: [wordIndex, kanjiIndex]
      };
      kanjiCounter++;
    });
  });
  return kanjiArrayWithLocation;
}

function displayWordData(wordArray, kanjiInfo) {
  wordArray.forEach((word, index) => {
    let japaneseWord = word.japanese[0].word;
    let wordReading = word.japanese[0].reading;
    let wordRomaji = wanakana.toRomaji(wordReading);
    let wordDefinitions = word.senses.map((definition, index) => {
      return definition.english_definitions.join(', ');
    });

    let wordResultSection = '';
    if (typeof japaneseWord === 'undefined') {
      wordResultSection = `
        <span class="japanese-word-hiragana">${wordReading}</span> (word)<br>
        <span class="japanese-word-romaji">${wordRomaji}</span> (romaji)<br>`;
    } else {
      wordResultSection = `
        <span class="japanese-word">${japaneseWord}</span> (word)<br>
        <span class="japanese-word-hiragana">${wordReading}</span> (reading)<br>
        <span class="japanese-word-romaji">${wordRomaji}</span> (romaji)<br>`;
    }
    let definitionSection = wordDefinitions
      .map((definition, index) => {
        return `<div class="definition">${index + 1}. ${definition}</div>`;
      })
      .join('');
    let kanjiSection = '';
    let $resultDiv = $(`
      <div class="row">
        <div class="col-3">
          <div class="word-result">
            ${wordResultSection}
          </div>
        </div>
        <div class="col-5">
          <div class="definition-result">
            ${definitionSection}
          </div>
        </div>
        <div class="col-4">
          ${kanjiSection}
        </div>
      </div>
      <hr>
    `);
    $resultDiv
      .hide()
      .appendTo('.js-results')
      .fadeIn(FADE_TIME);
  });
}

function pageScrollListener(wordArray) {
  // set this infinite scroll listener up
  $('place to look').submit(event => {
    processWordData(wordArray);
  });
}

function getKanjiInfoFromApi(searchTerm) {
  return new Promise((resolve, reject) => {
    const query = {
      headers: {
        'X-Mashape-Key': 'KCKQ5WNODBmshLeydUQgzK645yIOp1a4IPpjsnOsnNPVb3ini0'
      },
      url:
        'https://kanjialive-api.p.mashape.com/api/public/kanji/' + searchTerm,
      dataType: 'json',
      complete: function(data) {
        resolve(data);
      },
      error: function(data) {
        resolve();
      }
    };
    $.ajax(query);
  });
}

function processKanjiData(data) {
  let kanjiData = JSON.parse(data.responseText);
  if (typeof kanjiData.kanji === 'undefined') return '';
  let kanjiChar = kanjiData.kanji.character;
  let kanjiVid = kanjiData.kanji.video.mp4;
  let kanjiVidPoster = kanjiData.kanji.video.poster;
  let kanjiMeaning = kanjiData.kanji.meaning.english;
  let kanjiStrokes = kanjiData.kanji.strokes.count;
  let kanjiGrade = kanjiData.references.grade;
  if (kanjiGrade === null) kanjiGrade = 'not listed';
  let kanjiGroup = `
      <div class="kanji-group">
        <div class="kanji-col-left">
          <div class="kanji-result">
            <video width="320" height="240" controls poster="${kanjiVidPoster}">
              <source src="${kanjiVid}" type="video/mp4">
              Your browser does not support the video tag.</video>
          </div>
        </div>
        <div class="kanji-col-right">
          meaning: ${kanjiMeaning}
          <br>strokes: ${kanjiStrokes}
          <br>grade: ${kanjiGrade}
        </div>
      </div>
    `;
  return { index, kanjiGroup };
}

$(startApp);

//  OLD *****

// function displayHiraganaInfo(charArray, charLabelArray) {
//   let hiraganaArray = [];
//   charArray.forEach((char, index) => {
//     if (charLabelArray[index] === 'hiragana') hiraganaArray.push(char);
//   });
//   if (hiraganaArray.length !== 0) {
//     hiraganaArray.forEach(char =>
//       $('.js-hiragana').append(`<span class='large-character'>${char}</span>`)
//     );
//   }
// }

// function displayKatakanaInfo(charArray, charLabelArray) {
//   let katakanaArray = [];
//   charArray.forEach((char, index) => {
//     if (charLabelArray[index] === 'katakana') katakanaArray.push(char);
//   });
//   if (katakanaArray.length !== 0) {
//     katakanaArray.forEach(char =>
//       $('.js-katakana').append(`<span class='large-character'>${char}</span>`)
//     );
//   }
// }

// function highlightCharacters(japaneseWord) {
//   let containsKanji = false;
//   let charArray = japaneseWord.split('');
//   let charLabelArray = charArray.map(char => {
//     if (
//       (char >= '\u4e00' && char <= '\u9faf') ||
//       (char >= '\u3400' && char <= '\u4dbf')
//     ) {
//       containsKanji = true;
//       return 'kanji';
//     } else if (char >= '\u3040' && char <= '\u309f') {
//       return 'hiragana';
//     } else if (char >= '\u30a0' && char <= '\u30ff') {
//       return 'katakana';
//     } else {
//       return false;
//     }
//   });
//   let wordWithMarkup = charLabelArray
//     .map((label, index) => {
//       return `<span class='${label}-color'>${charArray[index]}</span>`;
//     })
//     .join('');
//   $('.js-word').html(wordWithMarkup);
//   requestKanjiData(charArray, charLabelArray, containsKanji);
//   displayHiraganaInfo(charArray, charLabelArray);
//   displayKatakanaInfo(charArray, charLabelArray);
// }

// function getWordFromApi(searchTerm, callback) {
//   const query = {
//     url: 'https://glosbe.com/gapi/translate',
//     dataType: 'jsonp',
//     success: callback,
//     data: {
//       from: 'eng',
//       dest: 'jpn',
//       format: 'json',
//       phrase: searchTerm,
//       pretty: 'true'
//     }
//   };
//   $.ajax(query);
// }

// make section for alert! right now put it in learn more
// function displayWordSearchData(data) {
//   if (data.tuc.length === 0) {
//     $('.learn-more').text('sorry, nothing found!');
//     $('.learn-more').fadeIn(FADE_TIME);
//   } else {
//     let japaneseWord = data.tuc[0].phrase.text;
//     getWordReadingFromApi(japaneseWord, displayWordReadingData);
//     highlightCharacters(japaneseWord);
//   }
// }

// function getWordReadingFromApi(searchTerm, callback) {
//   const query = {
//     url:
//       'https://jeff-cors-anywhere-nzumhvclct.now.sh/https://jlp.yahooapis.jp/FuriganaService/V1/furigana',
//     dataType: 'text',
//     success: callback,
//     data: {
//       appid: 'dj00aiZpPXBFWnZSUGdRTFZJeSZzPWNvbnN1bWVyc2VjcmV0Jng9OWI-',
//       sentence: searchTerm
//     }
//   };
//   $.ajax(query);
// }

// function displayWordReadingData(data) {
//   let result = convert.xml2js(data, { compact: true, ignoreDeclaration: true });
//   let wordReadingData = result.ResultSet.Result.WordList.Word;
//   let wordFurigana = '';
//   if (Array.isArray(wordReadingData)) {
//     wordFurigana = wordReadingData.reduce((accumulator, currentValue) => {
//       return accumulator.Furigana._text + currentValue.Furigana._text;
//     });
//   } else {
//     wordFurigana = wordReadingData.Furigana._text;
//   }
//   let wordRomaji = wanakana.toRomaji(wordFurigana);
//   $('.js-romaji').text(wordRomaji);
//   fadeInContent();
// }
// function requestKanjiData(charArray, charLabelArray, containsKanji) {
//   if (containsKanji) {
//     let kanjiArray = [];
//     charArray.forEach((char, index) => {
//       if (charLabelArray[index] === 'kanji') kanjiArray.push(char);
//     });
//     kanjiArray.forEach(char =>
//       getKanjiInfoFromApi(char, displayKanjiSearchData)
//     );
//   }
// }
// function fadeInContent() {
//   $('.word').fadeIn(FADE_TIME);
//   $('.learn-more').fadeIn(FADE_TIME);
//   if (!$('.js-romaji').is(':empty')) $('.romaji').fadeIn(FADE_TIME);
//   if (!$('.js-kanji').is(':empty')) $('.kanji').fadeIn(FADE_TIME);
//   if (!$('.js-hiragana').is(':empty')) $('.hiragana').fadeIn(FADE_TIME);
//   if (!$('.js-katakana').is(':empty')) $('.katakana').fadeIn(FADE_TIME);
// }
