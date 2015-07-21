<?php
$dbname = $_GET['dbname'];
$nid = $_GET['nid'];
$conn = pg_pconnect("dbname=".$dbname." user=postgres password=jabberw0cky");
if ( $conn )
{
    $result = pg_query($conn,"select body_value from field_data_body where entity_id='".$nid."'");
    $to_encode = array();
    while($row = pg_fetch_assoc($result)) {
        $to_encode[] = $row;
    }
}
echo json_encode($to_encode);?>
