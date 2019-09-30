import React, {Component} from 'react';
import {Accordion, Button, Card, Col, Container, Form, Row, Table} from 'react-bootstrap'
import {Typeahead} from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import './WorkflowDefs.css'
import DefinitionModal from "./DefinitonModal/DefinitionModal";
import InputModal from "./InputModal/InputModal";
import DiagramModal from "./DiagramModal/DiagramModal";
import PageCount from "../../../common/PageCount";
import PageSelect from "../../../common/PageSelect";
import {wfLabelsColor} from "../../../constants";

const http = require('../../../../server/HttpServerSide').HttpClient;

class WorkflowDefs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            keywords: "",
            labels: [],
            data: [],
            table: [],
            activeRow: null,
            activeWf: null,
            defModal: false,
            diagramModal: false,
            defaultPages: 20,
            pagesCount: 1,
            viewedPage: 1,
            allLabels: []
        };
        this.table = React.createRef();
        this.onEditSearch = this.onEditSearch.bind(this);
    }

    componentWillMount() {
        this.search();
    }

    componentDidMount() {
        http.get('/api/conductor/metadata/workflow').then(res => {
            if (res.result) {
                let size = ~~(res.result.length / this.state.defaultPages);
                let dataset = res.result.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)) || [];
                let allLabels = this.getLabels(dataset);
                this.setState({
                    data: dataset,
                    pagesCount: res.result.length % this.state.defaultPages ? ++size : size,
                    allLabels: allLabels,
                })
            }
        })
    }

    getLabels(dataset) {
        let labelsArr = [];
        dataset.map(({description}) => {
            let str = description && description.match(/-(,|) [A-Z].*/g)
                ? description.substring(description.indexOf("-") + 1) : "";
            if (str !== "") {
                str = str.replace(/\s/g, "");
                labelsArr = labelsArr.concat(str.split(","));
            }
            return null;
        });
        let allLabels = [...new Set([].concat(...labelsArr))];
        return allLabels.filter((e) => {return e !== ""}).sort((a, b) => (a > b) ? 1 : ((b > a) ? -1 : 0));
    }

    onEditSearch(event) {
        this.setState({
            keywords: event.target.value,
            activeWf: null,
            activeRow: null
        }, () => {
            this.search()
        })
    }

    onLabelSearch(event) {
        this.setState({
            labels: event,
            activeWf: null,
            activeRow: null
        }, () => {
            this.searchLabel()
        })
    }

    searchLabel() {
        let toBeRendered = [];
        const rows = this.state.keywords !== "" ? this.state.table : this.state.data;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i]["description"]) {
                let tags = rows[i]["description"].split("-").pop().replace(/\s/g, "").split(",");
                if (this.state.labels.every(elem => tags.indexOf(elem) > -1)) {
                    toBeRendered.push(rows[i]);
                }
            }
        }
        let size = ~~(toBeRendered.length / this.state.defaultPages);
        this.setState({
            table: toBeRendered,
            pagesCount: toBeRendered.length % this.state.defaultPages ? ++size : size,
            viewedPage: 1
        });
        return null;
    }

    searchFavourites() {
        let labels = this.state.labels;
        let index = labels.findIndex(label => label === "FAVOURITE");
        index > -1 ? labels.splice(index, 1) : labels.push("FAVOURITE");
        this.setState({
            labels: labels,
            activeWf: null,
            activeRow: null
        }, () => {
            this.searchLabel()
        })
    }

    search() {
        let toBeRendered = [];

        let query = this.state.keywords.toUpperCase();
        if (query !== "") {
            let rows = this.state.table.length > 0 ? this.state.table : this.state.data;
            let queryWords = query.split(" ");
            for (let i = 0; i < queryWords.length; i++) {
                for (let j = 0; j < rows.length; j++)
                    if (rows[j]["name"] && (rows[j]["name"].toString().toUpperCase().indexOf(queryWords[i]) !== -1
                        || rows[j]["name"].toString().toUpperCase().replace(/_/gi, " ").indexOf(queryWords[i]) !== -1))
                        toBeRendered.push(rows[j]);
                rows = toBeRendered;
                toBeRendered = [];
            }
            toBeRendered = rows
        } else {
            this.searchLabel();
            return;
        }
        let size = ~~(toBeRendered.length / this.state.defaultPages);
        this.setState({
            table: toBeRendered,
            pagesCount: toBeRendered.length % this.state.defaultPages ? ++size : size,
            viewedPage: 1
        })
    }

    changeActiveRow(i) {
        let dataset = this.state.keywords === "" && this.state.labels.length < 1 ? this.state.data : this.state.table;
        this.setState({
            activeRow: this.state.activeRow === i ? null : i,
            activeWf: dataset[i]["name"] + " / " + dataset[i]["version"]
        });
    }

    updateFavourite(data) {
        if (data.description) {
            if (!data.description.match(/-(| )[A-Z]*/g))
                data.description += ' -';
            data.description = data.description.includes(", FAVOURITE")
                ? data.description.replace(", FAVOURITE", "")
                : data.description += ", FAVOURITE";
        } else {
            data.description = "-, FAVOURITE"
        }
        http.put('/api/conductor/metadata/', [data]).then( response => {
            http.get('/api/conductor/metadata/workflow').then(res => {
                let dataset = res.result.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)) || [];
                let allLabels = this.getLabels(dataset);
                this.setState({
                    data: dataset,
                    allLabels: allLabels
                })
            })
        });
    }

    setCountPages(defaultPages, pagesCount){
        this.setState({
            defaultPages : defaultPages,
            pagesCount: pagesCount,
            viewedPage: 1
        })
    }

    setViewPage(page){
        this.setState({
            viewedPage: page
        })
    }

    createLabels = ({description}) => {
        let labels = [];
        let str =  description && description.match(/-(,|) [A-Z].*/g)
            ? description.substring(description.indexOf("-") + 1) : "";
        let wfLabels = str.replace(/\s/g, "").split(",");
        wfLabels.forEach(label => {
            if (label !== "") {
                let index = this.state.allLabels.findIndex(lab => lab === label);
                let color = index >= wfLabelsColor.length
                    ? wfLabelsColor[0]
                    : wfLabelsColor[index];
                let newLabels = (this.state.labels.findIndex(lbl => lbl === label) < 0) ? [...this.state.labels, label] : this.state.labels;
                labels.push(
                    <div style={{backgroundColor: color}} className="wfLabel" onClick={(e) => {
                        e.stopPropagation(); this.onLabelSearch(newLabels)}}>
                        {label}
                    </div>
                )
            }
        });
        return labels;
    };

    repeat() {
        let output = [];
        let defaultPages = this.state.defaultPages;
        let viewedPage = this.state.viewedPage;
        let dataset = this.state.keywords === "" && this.state.labels.length < 1 ? this.state.data : this.state.table;
        for (let i = 0; i < dataset.length; i++) {
            if (i >= (viewedPage - 1) * defaultPages && i < viewedPage * defaultPages) {
                output.push(
                    <div className="wfRow" key={i}>
                        <Accordion.Toggle id={`wf${i}`} onClick={this.changeActiveRow.bind(this, i)}
                                          className="clickable wfDef" as={Card.Header} variant="link" eventKey={i}>
                            <b>{dataset[i]["name"].replace(/_/g, " ")}</b>
                            <br/>
                            <div className="description">
                                {"version " + dataset[i]["version"]+": "}
                                {dataset[i]["description"]
                                    ? dataset[i]["description"].split("-")[0]
                                    : null }
                                {this.createLabels(dataset[i])}
                            </div>
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey={i}>
                            <Card.Body style={{padding: "0px"}}>
                                <div style={{
                                    background: "linear-gradient(-120deg, rgb(0, 147, 255) 0%, rgb(0, 118, 203) 100%)",
                                    padding: "15px",
                                    marginBottom: "10px"
                                }}>
                                    <Button variant="outline-light noshadow"
                                            onClick={this.showInputModal.bind(this)}>Input</Button>
                                    <Button variant="outline-light noshadow"
                                            onClick={this.showDefinitionModal.bind(this)}>Definition</Button>
                                    <Button variant="outline-light noshadow"
                                            onClick={this.showDiagramModal.bind(this)}>Diagram</Button>
                                    <Button variant="outline-light noshadow" onClick={this.updateFavourite.bind(this, dataset[i])}>
                                        <i className={dataset[i]["description"] && dataset[i]["description"].includes("FAVOURITE") ? 'fa fa-star' : 'far fa-star'}
                                           style={{cursor: 'pointer'}}/>
                                    </Button>
                                </div>
                                <div className="accordBody">
                                    <b>Tasks</b><br/>
                                    <p>{JSON.stringify(dataset[i]["tasks"].map(task => {
                                        return task.name
                                    }))}</p>
                                </div>
                            </Card.Body>
                        </Accordion.Collapse>
                    </div>
                )
            }
        }
        return output
    }

    showDefinitionModal() {
        this.setState({
            defModal: !this.state.defModal
        })
    }

    showInputModal() {
        this.setState({
            inputModal: !this.state.inputModal
        })
    }

    showDiagramModal() {
        this.setState({
            diagramModal: !this.state.diagramModal
        })
    }


    render(){

        let definitionModal = this.state.defModal ?
            <DefinitionModal wf={this.state.activeWf} modalHandler={this.showDefinitionModal.bind(this)}
                             show={this.state.defModal}/> : null;

        let inputModal = this.state.inputModal ?
            <InputModal wf={this.state.activeWf} modalHandler={this.showInputModal.bind(this)}
                        show={this.state.inputModal}/> : null;

        let diagramModal = this.state.diagramModal ?
            <DiagramModal wf={this.state.activeWf} modalHandler={this.showDiagramModal.bind(this)}
                          show={this.state.diagramModal}/> : null;

        return (
         <div>
             {definitionModal}
             {inputModal}
             {diagramModal}
             <Row>
                 <Button style={{marginBottom: "15px", marginLeft: "15px"}} onClick={this.searchFavourites.bind(this)} title="Favourites">
                     <i className={this.state.labels.length ? (this.state.labels.includes("FAVOURITE") ? 'fa fa-star' : 'far fa-star') : "far fa-star"}
                        style={{ cursor: 'pointer'}}
                     />
                 </Button>
                 <Col>
                     <Typeahead
                         id="typeaheadDefs"
                         selected={this.state.labels}
                         onChange={this.onLabelSearch.bind(this)} clearButton
                         labelKey="name" multiple options={this.state.allLabels}
                         placeholder="Search by label."/>
                 </Col>
                 <Col>
                     <Form.Group>
                         <Form.Control value={this.state.keywords} onChange={this.onEditSearch}
                                       placeholder="Search by keyword."/>
                     </Form.Group>
                 </Col>
             </Row>
             <div className="scrollWrapper" style={{maxHeight: "650px"}}>
                 <Table ref={this.table}>
                     <thead>
                     <tr>
                         <th>Name/Version</th>
                     </tr>
                     </thead>
                     <tbody>
                         <Accordion activeKey={this.state.activeRow}>
                             {this.repeat()}
                         </Accordion>
                     </tbody>
                 </Table>
             </div>
             <Container style={{marginTop: "5px"}}>
                 <Row>
                     <Col sm={2}>
                         <PageCount dataSize={this.state.keywords === "" || this.state.table.length > 0 ? this.state.table.length : this.state.data.length}
                                    defaultPages={this.state.defaultPages}
                                    handler={this.setCountPages.bind(this)}/>
                     </Col>
                     <Col sm={8}/>
                     <Col sm={2}>
                         <PageSelect viewedPage={this.state.viewedPage} count={this.state.pagesCount}
                                     handler={this.setViewPage.bind(this)}/>
                     </Col>
                 </Row>
             </Container>
         </div>
        )
    }
}

export default WorkflowDefs
