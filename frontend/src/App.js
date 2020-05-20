import React from "react";
import FullBackdrop from './FullBackdrop'
import Header from "./Header";
import Info from "./Info";
import Courses from "./Courses";
import Team from "./Team";
import Footer from "./Footer";
import OverlayBackground from './images/overlay_bg.jpg'

const styles = {
  parallax: {
    backgroundImage: 'url('+OverlayBackground+')',
    height: "100%",
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover"
  }
}

class App extends React.Component {
  constructor(){
    super();
    this.state = {
      "isLoggedIn": false,
      "loading": true,
      "email": undefined,
    }
    this.onSuccess = this.onSuccess.bind(this);
  }
  async componentDidMount() {
    window.scrollTo(0, 0)

    try {
      const requestOptions = {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        credentials: 'include'
      };
      let response = await fetch("/api/users/auth", requestOptions);
      if(response.status === 200){
        let result = await response.json();
        this.setState({
          "isLoggedIn": true,
          "loading": false,
          "email": result.email
        })
      }
      else{
        this.setState({
          "loading": false
        })
      }
    } 
    catch (err) {
      console.log("An error occurred: ");
      console.log(err);
    }
  }

  onSuccess(email){
    console.log("Login successfull");
    this.setState({
      "isLoggedIn": true,
      "email": email
    })
  }


  render() {
    var Main;
    if(this.state.isLoggedIn){
      Main = (<Courses courses={this.state.courses} role={this.state.role}/>)
    }
    else{
      Main = (<Info />)
    }

    return (
      <div style={styles.parallax}>
        <FullBackdrop backdrop={this.state.loading}/>
        <Header isLoggedIn={this.state.isLoggedIn} email={this.state.email} onSuccess={this.onSuccess} />
        {Main}
        <Team />
        <Footer />
      </div>
    )
  }
}

export default App;