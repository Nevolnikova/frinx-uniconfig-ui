import React, {Component} from 'react';
import { ReactGhLikeDiff } from 'react-gh-like-diff';
import { CONFIG, OPER } from './constants';
import JSONField from "./JSONField";
import { Button } from "react-bootstrap";

const defaultOptions = {
    originalFileName: 'Operational',
    updatedFileName: 'Operational',
    inputFormat: 'diff',
    outputFormat: 'line-by-line',
    showFiles: false,
    matching: 'none',
    matchWordsThreshold: 0.25,
    matchingMaxComparisons: 2500
};


class UniConfig extends Component {
    constructor(props) {
        super(props);

        this.state = {
            config: '{}',
            operational: '{}',
            showDiff: false,
            creatingSnap: false,
            syncing: false,
            initializing: true
        }
    }

    componentDidMount() {
        setTimeout( this.fetchData.bind(this), 500);
    }

    fetchData(){
        //pass device name cmp will mount
        fetch(CONFIG)
            .then(response => response.text())
            .then(config => this.setState({config}));

        fetch(OPER)
            .then(response => response.text())
            .then(operational => this.setState({operational}));
        this.setState({initializing: false})
    }

    getEditedConfig(newData) {
        this.setState({
            config: JSON.stringify(newData, null, 2),
        })
    }

    showDiff(){
        this.setState({
            showDiff: !this.state.showDiff,
        });
    }

    commitToNetwork(){
        this.setState({
            operational: this.state.config,
        });
    }

    syncFromNetwork(){
        this.setState({syncing: true});
        fetch(OPER)
            .then(response => response.text())
            .then(operational => this.setState({operational}))
            .then(() => {
                this.setState({syncing: false});
            })
    }

    refreshConfig(){
        fetch(CONFIG)
            .then(response => response.text())
            .then(config => this.setState({config}));
    }

    loadSnapshot(snapshot){
        if(snapshot.length < 1){
            this.refreshConfig();
        } else {
            this.setState({
                config: JSON.stringify(snapshot, null, 2),
            });
        }

        //if snapshot == null load config from device
    }

    createSnapshot(){
        this.setState({
            creatingSnap: !this.state.creatingSnap,
        })
    }

    render() {

        let configJSON = JSON.stringify(JSON.parse(this.state.config), null, 2);
        let operationalJSON = JSON.stringify(JSON.parse(this.state.operational), null, 2);

        console.log(configJSON);
        console.log(operationalJSON);

        const operational = () => (
            <div>
                <div>
                    <h2 style={{display: "inline-block", marginTop: "5px"}}>Operational</h2>
                    <div style={{float: "right"}}>
                        <Button className="btn btn-primary" style={{marginRight: '5px'}}
                                onClick={this.syncFromNetwork.bind(this)}>
                            <i className={this.state.syncing ? "fas fa-sync fa-spin" : "fas fa-sync"}/>
                            &nbsp;&nbsp;{this.state.syncing ? "Synchronizing..." : "Sync from network"}
                        </Button>
                    </div>
                </div>
                {this.state.showDiff ?
                    <ReactGhLikeDiff
                        options={defaultOptions}
                        past={operationalJSON}
                        current={configJSON}
                    />
                    :
                    <JSONField title="" editable={false} updateDiff={this.getEditedConfig.bind(this)}
                            wfs={JSON.parse(operationalJSON)}/>
                }
            </div>
        );

        return (
            <div className="uniconfig">


                    <div className="config">
                            { this.state.initializing ?
                                <i className="fas fa-sync fa-spin fa-8x" style={{margin: '40%', color: 'lightblue'}}/>
                                :
                                <JSONField title="Configurational" editable={true}
                                getEditedConfig={this.getEditedConfig.bind(this)} wfs={JSON.parse(configJSON)}
                                refreshConfig={this.refreshConfig.bind(this)}/>
                            }
                    </div>

                    <div className="operational">
                            { this.state.initializing ?
                                <i className="fas fa-sync fa-spin fa-8x" style={{margin: '40%', color: 'lightblue'}}/>
                                :
                                operational()
                            }
                    </div>

            </div>


      );
    }
}

export default UniConfig;
