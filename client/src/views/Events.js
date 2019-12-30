import React, { Component } from "react";
import "./Events.css";
import Modal from "../components/Modal/Modal";
import Backdrop from "../components/Backdrop/Backdrop";
import AuthContext from "../context/auth-context";
import EventList from "../components/Events/EventList/EventList";
import Spinner from "../components/Spinner/Spinner.js";

class EventsPage extends Component {
  state = {
    creating: false,
    events: [],
    isLoading: false,
    selectedEvent: false
  };

  isActive = true;

  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.titleElRef = React.createRef();
    this.priceElRef = React.createRef();
    this.dateElRef = React.createRef();
    this.descriptionElRef = React.createRef();
  }

  componentDidMount() {
    this.fetchEvents();
  }

  fetchEvents() {
    this.setState({
      isLoading: true
    });
    const requestBody = {
      query: `
                query{                 
                    events{
                        _id
                        title
                        price
                        description
                        date
                        creator {
                          _id
                          email
                        }
                        }  
                    }
            `
    };

    fetch("http://localhost:8000/graphql", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("failed");
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        const events = resData.data.events;
        if(this.isActive){
          this.setState({
            events: events,
            isLoading: false
          });
        }
        
      })
      .catch(err => {
        console.log(err);
        if(this.isActive){
          this.setState({
            isLoading: false
          });
        }
        
      });
  }

  startCreateEventHandler = () => {
    this.setState({
      creating: true
    });
  };

  modalConfirmHandler = () => {
    this.setState({ creating: false });

    const title = this.titleElRef.current.value;
    const price = +this.priceElRef.current.value;
    const description = this.descriptionElRef.current.value;
    const date = this.dateElRef.current.value;

    if (
      (title.trim().length === 0 || price <= 0,
      description.trim().length === 0 || date.trim().length === 0)
    ) {
      return;
    }

    const event = { title, price, date, description };
    console.log(event);

    const token = this.context.token;

    const requestBody = {
      query: `
                mutation{
                    createEvent(
                        eventInput: {
                            title: "${title}",
                            description: "${description}",
                            price: ${price},
                            date: "${date}"
                    })
                    {
                        _id
                        title
                        description
                        date
                        }  
                    }
            `
    };

    fetch("http://localhost:8000/graphql", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("failed");
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        this.setState(prevState => {
          const updatedEvents = [...prevState.events];
          updatedEvents.push({
            _id: resData.data.createEvent._id,
            title: resData.data.createEvent.title,
            price: resData.data.createEvent.price,
            description: resData.data.createEvent.description,
            date: resData.data.createEvent.date,
            creator: {
              _id: this.context.userId
            }
          });
          return {
            events: updatedEvents
          };
        });
      })
      .catch(err => {
        console.log(err);
      });
  };

  modalCandelHandler = () => {
    this.setState({ creating: false, selectedEvent: null });
  };

  showDetailHandler = eventId => {
    this.setState(prevState => {
      const selectedEvent = prevState.events.find(e => e._id === eventId);
      return {
        selectedEvent: selectedEvent
      };
    });

    console.log(this.state);
  };

  bookEventHandler = () => {
    const { selectedEvent } = this.state;

    if (!this.context.token) {
      this.setState({
        selectedEvent: null
      });
      return;
    }

    this.setState({
      isLoading: true
    });
    const requestBody = {
      query: `
                mutation{                 
                    bookEvent(eventId: "${selectedEvent._id}"){
                        _id
                        createdAt
                        updatedAt
                        }  
                    }
            `
    };

    const token = this.context.token;

    fetch("http://localhost:8000/graphql", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      }
    })
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("failed");
        }
        return res.json();
      })
      .then(resData => {
        console.log(resData);
        this.setState({
          selectedEvent: null
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isLoading: false
        });
      });
  };

  componentWillUnmount(){
    this.isActive = false;
  }

  render() {
    const { events, isLoading, selectedEvent } = this.state;

    return (
      <React.Fragment>
        {(this.state.creating || selectedEvent) && <Backdrop />}
        {this.state.creating && (
          <Modal
            title="Add Event"
            canCancel
            canConfirm
            onCancel={this.modalCandelHandler}
            onConfirm={this.modalConfirmHandler}
            confirmText={this.context.token ? "Book" : "Confirm"}
          >
            <form>
              <div className="form-control">
                <label htmlFor="title">Title</label>
                <input type="text" id="title" ref={this.titleElRef} />
              </div>
              <div className="form-control">
                <label htmlFor="price">price</label>
                <input type="number" id="price" ref={this.priceElRef} />
              </div>
              <div className="form-control">
                <label htmlFor="date">Date</label>
                <input type="datetime-local" id="date" ref={this.dateElRef} />
              </div>
              <div className="form-control">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows="4"
                  ref={this.descriptionElRef}
                />
              </div>
            </form>
          </Modal>
        )}
        {selectedEvent && (
          <Modal
            title={selectedEvent.title}
            canCancel
            canConfirm
            onCancel={this.modalCandelHandler}
            onConfirm={this.bookEventHandler}
            confirmText="Book"
          >
            <h1>{selectedEvent.title}</h1>
            <h2>
              ${selectedEvent.price} -{" "}
              {new Date(selectedEvent.date).toLocaleDateString()}
            </h2>
            <p>{selectedEvent.description}</p>
          </Modal>
        )}
        {this.context.token && (
          <div className="events-control">
            <p>Share your own Events!</p>
            <button className="btn" onClick={this.startCreateEventHandler}>
              Create Event
            </button>
          </div>
        )}
        {isLoading ? (
          <Spinner />
        ) : (
          <EventList
            onViewDetail={this.showDetailHandler}
            events={events}
            authUserId={this.context.userId}
          />
        )}
      </React.Fragment>
    );
  }
}

export default EventsPage;
