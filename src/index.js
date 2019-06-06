import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import styled from 'styled-components'
let sw = require('stopword');

const Paragraph = styled.p`
  font-size: 1em;
  color: black;
`
const Head1 = styled.h1`
  font-size: 2.5em;
  font-weight: bold;
  color: royalblue;
`

const Head2 = styled.h2`
  font-size: 1.5em;
  color: black;
`

const Head3 = styled.h3`
  font-size: 1.5em;
  font-weight: bold;
  color: black;
`

const Head4 = styled.h4`
  font-size: 1.25em;
  color: black;
`

const Button = styled.button`
  color: royalblue;
  font-size: 0.95em;
  margin: 0.3em;
  padding: 0.25em 0.5em;
  border: 2px solid royalblue;
  border-radius: 10px;
`
const Input = styled.input`
  padding: 0.5em;
  margin: 0.5em;
  font-size: 0.95em;
  color: royalblue;
  background: papayawhip;
  border: none;
  border-radius: 30px;
`;
const Select = styled.select`
  width: 12em;
  height: 2em;
  background: white;
  color: royalblue;
  padding-left: 0.25em;
  padding-right: 1em;
  font-size: 1em;
  border: none;
  background: papayawhip;
  margin-left: 10px;

  option {
    color: royalblue;
    background: papayawhip;
    display: flex;
    white-space: pre;
    min-height: 20px;
    padding: 0px 2px 1px;
  }
`


function cleanHTML(html) {
  let re = new RegExp('(<!--)(.)+(-->)')
  let tempHtml = html
  while (tempHtml.replace(re, '') !== html)
  {
    html = html.replace(re, '')
    tempHtml = html
  }
  var div = document.createElement('div');
  div.innerHTML = html;
  var scripts = div.getElementsByTagName('script');
  var iter = scripts.length;
  while (iter--) {
    scripts[iter].parentNode.removeChild(scripts[iter]);
  }
  var styles = div.getElementsByTagName('style');
  var iter2 = styles.length;
  while (iter2--) {
    styles[iter2].parentNode.removeChild(styles[iter2]);
  }
  html =  div.innerHTML;
  return html;
}

function processHTML(html, stop) {
  // REMEMBER THAT THE HIGHLIGHT OVER A WORD SHOULD BE A TERM TOKEN ON ITS OWN
  // AND SHOULDNT ACCIDENTALLY BE INSIDE CHARACTERS -------DONE
  // AND THEN FIX THE OG FREQ SORTER                -------DONE
  // AND THEN FIX BUTTONS                           -------DONE
  // FEATURE FOR DISABLING STOP WORDS               -------DONE
  // AND THEN CLEAN UP                              -------DONE
  // AND THEN BE BEAUTIFUL                          -
  // AND ADD IP TRACKING                            -------DONE
  // AND UPLOAD TO HEROKU APP                       -
  let text = '' ;
  let totaltext = '';
  let tag = '';
  let tagging = false;
  let endTag = false;
  let freqs = new Map();
  for ( let i = 0; i < html.length; i++) { 
    if (i < html.length - 1 && html.slice(i, i+2) === '</')
    {
      tagging = true;
      endTag = true;
      let re2 = new RegExp('[^a-zA-Z0-9\'_]+');
      let terms = text.toLowerCase().split(re2);
      if (stop === 'Yes') {
        terms = sw.removeStopwords(terms)
      }
      if (text !== '')
      {
        totaltext += text + '\n';
      }
      for (let term of terms)
      {
        if (term !== '')
        {
          if (freqs.has(term))
          {
            freqs.set(term, 1 + freqs.get(term));
          }
          else {
            freqs.set(term, 1);
          }
        }
      }
      text = '';
    }
    else if (html[i] === '<') {
      tagging = true;
      endTag = false;
    }
    else if (html[i] === '>') {
      tagging = false;
      endTag = false;
      if (tag.search(' ') !== -1)
      {
        tag = tag.slice(0, tag.search(' '))
      }
      tag = ''
      continue;
    }
    if (tagging)
    {
      tag += html[i];
    }
    else if (!(endTag))
    {
      text += html[i];
    }
  }
  freqs.set(totaltext, 1);
  for (let key of freqs.keys())
  {
    if (freqs.get(key) > 0)
    {
      // CONSOLE DEBUGGING CHECKPOINT
      //console.log(key, freqs.get(key))
    }
    else
    {
      freqs.delete(key)
    }
  }
  return freqs;
}

class Problem extends React.Component{
    constructor(props) {
      super(props)
      this.a = props.url;
      this.html = '';
      this.htmlHighlight = '';
      this.stop = props.stop;
      this.state = {
        info: '',
        freqs: new Map(),
        textHighlight: '',
        clicked: false,
        rows: []
      };
      var proxyUrl = 'https://cors-anywhere.herokuapp.com/'
      fetch(proxyUrl + this.a)
      .then(res => res.text())
      .then(data => this.handleData(data))
      .catch(e => {
        console.log(e);
        return e;
      });
    }

    highlightWord(word) {
      if (!this.state.clicked){
        if (this.state.info === this.state.textHighlight)
        {
          let newHTML = '';
          let i = 0;
          while (i < this.state.info.length) {
            if (i < this.state.info.length - word.length + 1 && (i > 0 && !(/^[0-9a-zA-Z]+$/.test(this.state.info[i-1])) && !(/^[0-9a-zA-Z]+$/.test(this.state.info[i+word.length]))) && this.state.info.slice(i, i + word.length).toLowerCase() === word.toLowerCase())
            {
              newHTML += '<mark>' + this.state.info.slice(i, i + word.length) + '</mark>';
              i += word.length;
            }
            else {
              newHTML += this.state.info[i];
              i++;
            }
          }
          this.setState({textHighlight: newHTML, clicked: true});
        }
      }
      else {
        this.setState({textHighlight: this.state.info, clicked: false});
      }
    }

    handleData(data) {
      let myFreqs = processHTML(cleanHTML(data), this.stop);
      let myInfo = Array.from(myFreqs.keys()).sort(function (a, b) { return b.length - a.length; })[0];
      myFreqs.delete(myInfo);
      let myRows = [];
      let temp = new Map([['0', ['', 0]], ['1', ['', 0]], ['2', ['', 0]], ['3', ['', 0]], ['4', ['', 0]], ['5', ['', 0]], ['6', ['', 0]], ['7', ['', 0]], ['8', ['', 0]], ['9', ['', 0]]]);
      
      let i = 0;
      while (i < 10)
      {
        let max = Math.max.apply(Math, Array.from(myFreqs.values()));
        for (let term of myFreqs.keys())
        {
          if (max === myFreqs.get(term))
          {
            temp.set(String(i), [term, myFreqs.get(term)]);
            myFreqs.delete(term);
            break;
          }
        }
        i++;
      }

      for (let key of temp.keys()) {
        myRows.push(<Button onClick= {() => this.highlightWord(temp.get(key)[0])}>{temp.get(key)[0][0].toUpperCase() + temp.get(key)[0].slice(1, temp.get(key)[0].length)}: {temp.get(key)[1]} occurence(s)</Button>);
      }
      this.setState({ info: myInfo, freqs: myFreqs, textHighlight: myInfo, rows: myRows });
      
    }
    

    render() { 
      const { textHighlight, rows } = this.state
      $("#element").html(textHighlight.replace(/(\n)/g, '<br>'));

      return (
        <div>
          <Head3>The Breakdown of {this.a}:</Head3>
          <Head4>Summary of the Data - The Most Frequent Words</Head4>
          <table>
            <tbody>{rows}</tbody>
          </table>
          <Head4>Text Preview</Head4>
          <Paragraph id='element'>Retrieving text preview . . .</Paragraph>
        </div>
      );
    }
}


  class Display extends React.Component {
    constructor(props) {
      super(props)
      this.state = {stop: "", url: ""}; 
      this.handleStopClick = this.handleStopClick.bind(this);
      this.handleURL = this.handleURL.bind(this);
      let today = new Date();
      let dateTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      $.getJSON('http://ip.jsontest.com/?callback=?', function(data) {
        console.log(dateTime + ' from: ' + data['ip']);
      });
    }

    handleStopClick(event) {
      this.setState({stop: event.target.value});
    }

    handleURL(event) {
      this.setState({url: event.target.value});
    }

    render() {
      return(
        <div>
          <Head1>YOUR WEBPAGE: A DEEPER INSIGHT</Head1>
          <Head2>By: Shivan Vipani</Head2>
          <br></br>
          <Head3>Enter a URL to explore:</Head3>
          <Input id="url" defaultValue="www.site.com" type="string" onChange={this.handleURL}></Input>
          <br></br>
          <br></br>
          <Head3>Select your parsing option to get a text view:</Head3>
          <Select onChange={this.handleStopClick}>
            <option val="">Remove stop words?</option>
            <option val="Yes">Yes</option>
            <option val="No">No</option>
          </Select>
          <br></br>
          <br></br>
          {(this.state.stop !== "" && this.state.stop !== "Remove stop words?") &&
            <Problem 
              stop = {this.state.stop}
              url = {(this.state.url)}
            />
          }
        </div>
      );
    }
  }
  
  // ========================================


  ReactDOM.render(
    <Display />,
    document.getElementById('root')
  );
  